package expo.modules.drivecam

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.video.VideoCapture
import androidx.core.content.ContextCompat
import java.io.File
import java.io.RandomAccessFile
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

class CameraForegroundService : LifecycleService() {

    companion object {
        const val ACTION_START_PREVIEW = "START_PREVIEW"
        const val ACTION_START_RECORDING = "START_RECORDING"
        const val ACTION_STOP_RECORDING = "STOP_RECORDING"
        const val ACTION_SHUTDOWN = "SHUTDOWN_CAMERA"
        const val CHANNEL_ID = "DriveCamChannel"

        var instance: CameraForegroundService? = null
        var activeSurfaceProvider: Preview.SurfaceProvider? = null
    }

    private var maxDurationMs: Long = 60000L
    private var maxSizeMB: Int = 100
    private var maxStorageUsageMB: Int = 1000
    private var autoDelete: Boolean = true
    private var autoOptimize: Boolean = false
    private var lensFacing = CameraSelector.LENS_FACING_BACK

    private var videoCapture: VideoCapture<Recorder>? = null
    private var previewUseCase: Preview? = null
    private var activeRecording: Recording? = null

    private var isIntentionalRecording = false

    private lateinit var cameraExecutor: ExecutorService
    private lateinit var metricsExecutor: ScheduledExecutorService

    private var isMuted = false
    private val savedFiles = Collections.synchronizedList(mutableListOf<File>())
    private var currentQuality = Quality.HIGHEST
    private var userRequestedQuality = Quality.HIGHEST

    override fun onCreate() {
        super.onCreate()
        instance = this
        cameraExecutor = Executors.newSingleThreadExecutor()
        metricsExecutor = Executors.newSingleThreadScheduledExecutor()

        createNotificationChannel()
        startForeground(1, createNotification("Camera on Standby", "Preview active..."))
        startSystemMetricsPolling()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        when (intent?.action) {
            ACTION_START_PREVIEW -> {
                updateNotification("Camera on Standby", "Preview active...")
                if (videoCapture == null) {
                    startCamera(startRecording = false)
                }
            }
            ACTION_START_RECORDING -> {
                maxDurationMs = intent.getLongExtra("maxDurationMs", 60000L)
                maxSizeMB = intent.getIntExtra("maxSizeMB", 100)
                maxStorageUsageMB = intent.getIntExtra("maxStorageUsageMB", 1000)
                autoDelete = intent.getBooleanExtra("autoDelete", true)
                autoOptimize = intent.getBooleanExtra("autoOptimize", false)
                lensFacing = if (intent.getStringExtra("lensFacing") == "front") {
                    CameraSelector.LENS_FACING_FRONT
                } else {
                    CameraSelector.LENS_FACING_BACK
                }

                val requestedQualityStr = intent.getStringExtra("quality")
                val newQuality = getQualityFromString(requestedQualityStr)

                val qualityChanged = newQuality != userRequestedQuality
                userRequestedQuality = newQuality
                currentQuality = newQuality

                if (autoOptimize) registerThermalBatteryReceiver()

                isIntentionalRecording = true
                updateNotification("Dashcam Active", "Recording in background...")

                if (videoCapture == null || qualityChanged) {
                    // STOP existing recording before rebooting camera for quality change
                    activeRecording?.stop()
                    activeRecording = null
                    startCamera(startRecording = true)
                } else {
                    startNewRecordingSegment()
                }
            }
            ACTION_STOP_RECORDING -> {
                isIntentionalRecording = false
                activeRecording?.stop()
                activeRecording = null
                updateNotification("Camera on Standby", "Preview active...")
            }
            ACTION_SHUTDOWN -> {
                isIntentionalRecording = false
                stopRecordingLogic()
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startCamera(startRecording: Boolean) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val recorder = Recorder.Builder()
            .setQualitySelector(QualitySelector.from(currentQuality))
            .build()

            videoCapture = VideoCapture.withOutput(recorder)
            previewUseCase = Preview.Builder().build()

            activeSurfaceProvider?.let {
                provider ->
                previewUseCase?.setSurfaceProvider(provider)
            }

            val cameraSelector = CameraSelector.Builder()
            .requireLensFacing(lensFacing)
            .build()

            try {
                cameraProvider.unbindAll()
                // MUST bind both at the same time to prevent breaking the pipeline
                cameraProvider.bindToLifecycle(this, cameraSelector, videoCapture!!, previewUseCase!!)

                if (startRecording) {
                    startNewRecordingSegment()
                }
            } catch (exc: Exception) {
                emitEvent("ERROR", mapOf("message" to (exc.message ?: "Camera binding failed")))
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startNewRecordingSegment() {
        if (!isIntentionalRecording) return
        if (activeRecording != null) return

        val videoCap = this.videoCapture ?: return

        val name = SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US).format(System.currentTimeMillis())
        val file = File(getExternalFilesDir(null), "$name.mp4")

        val outputOptions = FileOutputOptions.Builder(file)
        .setFileSizeLimit((maxSizeMB * 1024 * 1024).toLong())
        .setDurationLimitMillis(maxDurationMs)
        .build()

        var pendingRecording = videoCap.output.prepareRecording(this, outputOptions)
        if (!isMuted) pendingRecording = pendingRecording.withAudioEnabled()

        activeRecording = pendingRecording.start(ContextCompat.getMainExecutor(this)) {
            recordEvent ->
            if (recordEvent is VideoRecordEvent.Finalize) {
                if (!recordEvent.hasError() ||
                    recordEvent.error == VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED ||
                    recordEvent.error == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED) {

                    handleFinishedSegment(file)

                    if (instance != null && isIntentionalRecording) {
                        startNewRecordingSegment()
                    }
                } else {
                    emitEvent("ERROR", mapOf("message" to "Error: ${recordEvent.error}"))
                }
            }
        }
    }

    fun pauseRecording() {
        activeRecording?.pause()
        emitEvent("RECORDING_PAUSED", mapOf("status" to "paused"))
    }

    fun resumeRecording() {
        activeRecording?.resume()
        emitEvent("RECORDING_RESUMED", mapOf("status" to "recording"))
    }

    fun muteAudio(mute: Boolean) {
        isMuted = mute
        activeRecording?.mute(mute)
    }

    fun flipCamera() {
        activeRecording?.stop()
        activeRecording = null

        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
            lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK)
                CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
            startCamera(startRecording = isIntentionalRecording)
        }, 500)
    }

    fun attachSurfaceProvider(provider: Preview.SurfaceProvider?) {
        activeSurfaceProvider = provider
        // ONLY update the surface, DO NOT unbind/rebind the camera here
        ContextCompat.getMainExecutor(this).execute {
            previewUseCase?.setSurfaceProvider(provider)
        }
    }

    fun removeFileFromList(path: String) {
        // Must synchronize to prevent crashes if loop is reading while module is deleting
        synchronized(savedFiles) {
            val iterator = savedFiles.iterator()
            while (iterator.hasNext()) {
                val file = iterator.next()
                if (file.absolutePath == path) {
                    iterator.remove()
                    break
                }
            }
        }
    }

    private fun getQualityFromString(qualityStr: String?): Quality {
        return when (qualityStr) {
            "2160p" -> Quality.UHD
            "1080p" -> Quality.FHD
            "720p" -> Quality.HD
            "480p" -> Quality.SD
            "lowest" -> Quality.LOWEST
            else -> Quality.HIGHEST
        }
    }

    private fun startSystemMetricsPolling() {
        metricsExecutor.scheduleAtFixedRate({
            try {
                val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
                val batteryStatus = registerReceiver(null, filter)
                val rawTemp = batteryStatus?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
                val batteryTempCelsius = rawTemp / 10.0
                val batteryLevel = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1

                val cpuLoad = calculateCpuUsageSafely()

                emitEvent("SYSTEM_STATS", mapOf(
                    "cpuUsage" to cpuLoad,
                    "batteryTemperature" to batteryTempCelsius,
                    "batteryLevel" to batteryLevel,
                    "timestamp" to System.currentTimeMillis()
                ))
            } catch (e: Exception) {}
        }, 0, 3, TimeUnit.SECONDS)
    }

    private fun calculateCpuUsageSafely(): Double {
        return try {
            val reader = RandomAccessFile("/proc/stat", "r")
            var load = reader.readLine() ?: return 0.0
            var toks = load.split(" +".toRegex())
            val idle1 = toks[5].toLong()
            val cpu1 = toks[2].toLong() + toks[3].toLong() + toks[4].toLong() + toks[6].toLong() + toks[7].toLong() + toks[8].toLong()

            Thread.sleep(100)

            reader.seek(0)
            load = reader.readLine() ?: return 0.0
            reader.close()
            toks = load.split(" +".toRegex())
            val idle2 = toks[5].toLong()
            val cpu2 = toks[2].toLong() + toks[3].toLong() + toks[4].toLong() + toks[6].toLong() + toks[7].toLong() + toks[8].toLong()

            val total = (cpu2 - cpu1) + (idle2 - idle1)
            if (total <= 0) 0.0 else ((cpu2 - cpu1).toDouble() / total) * 100.0
        } catch (ex: Exception) {
            0.0
        }
    }

    private fun handleFinishedSegment(file: File) {
        savedFiles.add(file)
        emitEvent("SEGMENT_FINISHED", mapOf("file" to file.absolutePath))
        manageStorageLoop()
    }

    private fun manageStorageLoop() {
        if (!autoDelete) return

        synchronized(savedFiles) {
            var totalSize = savedFiles.sumOf {
                it.length()
            }
            val maxBytes = maxStorageUsageMB * 1024L * 1024L

            while (totalSize > maxBytes && savedFiles.isNotEmpty()) {
                val oldest = savedFiles.removeAt(0)
                if (oldest.exists()) {
                    totalSize -= oldest.length()
                    oldest.delete()
                }
            }
        }
    }

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val temp = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
            val celsius = temp / 10.0
            val newQuality = if (celsius > 40.0) Quality.LOWEST else Quality.HIGHEST
            if (newQuality != currentQuality) {
                currentQuality = newQuality
                activeRecording?.stop()
                activeRecording = null
                startCamera(startRecording = isIntentionalRecording)
            }
        }
    }

    private fun registerThermalBatteryReceiver() {
        registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
    }

    private fun emitEvent(type: String, data: Map<String, Any>) {
        DriveCamModule.instance?.emitCameraEvent(type, data)
    }

    private fun stopRecordingLogic() {
        activeRecording?.stop()
        activeRecording = null
        try {
            ProcessCameraProvider.getInstance(this).get().unbindAll()
            if (autoOptimize) unregisterReceiver(batteryReceiver)
        } catch (e: Exception) {}
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Dashcam Service", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    private fun createNotification(title: String, text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle(title)
        .setContentText(text)
        .setSmallIcon(android.R.drawable.ic_menu_camera)
        .build()
    }

    private fun updateNotification(title: String, text: String) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(1, createNotification(title, text))
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRecordingLogic()
        instance = null
        cameraExecutor.shutdown()
        metricsExecutor.shutdown()
    }
}