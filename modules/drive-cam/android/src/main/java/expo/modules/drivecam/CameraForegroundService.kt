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
        const val ACTION_START = "START_RECORDING"
        const val ACTION_STOP = "STOP_RECORDING"
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
    
    private lateinit var cameraExecutor: ExecutorService
    private lateinit var metricsExecutor: ScheduledExecutorService
    
    private var isMuted = false
    private val savedFiles = mutableListOf<File>()
    private var currentQuality = Quality.HIGHEST

    override fun onCreate() {
        super.onCreate()
        instance = this
        cameraExecutor = Executors.newSingleThreadExecutor()
        metricsExecutor = Executors.newSingleThreadScheduledExecutor()

        createNotificationChannel()
        startForeground(1, createNotification())
        startSystemMetricsPolling()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        when (intent?.action) {
            ACTION_START -> {
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

                if (autoOptimize) registerThermalBatteryReceiver()
                startCamera()
            }
            ACTION_STOP -> {
                stopRecordingLogic()
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(currentQuality))
                .build()

            videoCapture = VideoCapture.withOutput(recorder)
            previewUseCase = Preview.Builder().build()
            
            activeSurfaceProvider?.let { provider ->
                previewUseCase?.setSurfaceProvider(provider)
            }

            val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build()

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, videoCapture!!, previewUseCase!!)
                startNewRecordingSegment()
            } catch (exc: Exception) {
                emitEvent("ERROR", mapOf("message" to (exc.message ?: "Camera binding failed")))
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startNewRecordingSegment() {
        val videoCapture = this.videoCapture ?: return

        val name = SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US).format(System.currentTimeMillis())
        val file = File(getExternalFilesDir(null), "$name.mp4")

        val outputOptions = FileOutputOptions.Builder(file)
            .setFileSizeLimit((maxSizeMB * 1024 * 1024).toLong())
            .setDurationLimitMillis(maxDurationMs)
            .build()

        var pendingRecording = videoCapture.output.prepareRecording(this, outputOptions)
        if (!isMuted) pendingRecording = pendingRecording.withAudioEnabled()

        activeRecording = pendingRecording.start(ContextCompat.getMainExecutor(this)) { recordEvent ->
            if (recordEvent is VideoRecordEvent.Finalize) {
                if (!recordEvent.hasError() || 
                    recordEvent.error == VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED || 
                    recordEvent.error == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED) {
                    handleFinishedSegment(file)
                    if (instance != null) startNewRecordingSegment()
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
        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
        startCamera()
    }
    
    fun attachSurfaceProvider(provider: Preview.SurfaceProvider?) {
        ContextCompat.getMainExecutor(this).execute {
            previewUseCase?.setSurfaceProvider(provider)
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
            } catch (e: Exception) {
                // Fail-safe protection against isolated environment changes
            }
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
        var totalSize = savedFiles.sumOf { it.length() }
        val maxBytes = maxStorageUsageMB * 1024L * 1024L

        while (totalSize > maxBytes && savedFiles.isNotEmpty()) {
            val oldest = savedFiles.removeAt(0)
            if (oldest.exists()) {
                totalSize -= oldest.length()
                oldest.delete()
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
                startCamera()
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

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Dashcam Active")
            .setContentText("Recording in background...")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopRecordingLogic()
        instance = null
        cameraExecutor.shutdown()
        metricsExecutor.shutdown()
    }
}
