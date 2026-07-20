package expo.modules.drivecam

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
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
    private var isBatteryReceiverRegistered = false

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
        emitDebug("Service created successfully")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        val action = intent?.action
        emitDebug("Intent action received: $action")

        when (action) {
            ACTION_START_PREVIEW -> {
                updateNotification("Camera on Standby", "Preview active...")
                if (videoCapture == null || previewUseCase == null) {
                    startCamera(startRecording = false)
                }
            }
            ACTION_START_RECORDING -> {
                try {
                    maxDurationMs = intent.getLongExtra("maxDurationMs", 60000L)
                    maxSizeMB = intent.getIntExtra("maxSizeMB", 100)
                    maxStorageUsageMB = intent.getIntExtra("maxStorageUsageMB", 1000)
                    autoDelete = intent.getBooleanExtra("autoDelete", true)
                    autoOptimize = intent.getBooleanExtra("autoOptimize", false)

                    val requestedLensStr = intent.getStringExtra("lensFacing") ?: "back"
                    val requestedLens = if (requestedLensStr == "front") CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
                    val newQuality = getQualityFromString(intent.getStringExtra("quality"))

                    val qualityChanged = newQuality != userRequestedQuality
                    val lensChanged = requestedLens != lensFacing

                    userRequestedQuality = newQuality
                    currentQuality = newQuality
                    lensFacing = requestedLens

                    if (autoOptimize) registerThermalBatteryReceiver()

                    isIntentionalRecording = true
                    updateNotification("Dashcam Active", "Recording in background...")

                    if (activeRecording != null) {
                        emitDebug("Stopping existing active recording session before switching state")
                        activeRecording?.stop()
                        activeRecording = null
                    }

                    if (videoCapture == null || previewUseCase == null || qualityChanged || lensChanged) {
                        startCamera(startRecording = true)
                    } else {
                        startNewRecordingSegment()
                    }
                } catch (e: Exception) {
                    emitError("Error handling START_RECORDING", e)
                }
            }
            ACTION_STOP_RECORDING -> {
                emitDebug("Stop recording action triggered")
                isIntentionalRecording = false
                try {
                    activeRecording?.stop()
                } catch (e: Exception) {
                    emitError("Error stopping active recording", e)
                }
                activeRecording = null
                updateNotification("Camera on Standby", "Preview active...")
            }
            ACTION_SHUTDOWN -> {
                emitDebug("Shutdown action triggered")
                isIntentionalRecording = false
                stopRecordingLogic()
                stopSelf()
            }
        }
        return START_STICKY
    }

    private fun startCamera(startRecording: Boolean) {
        emitDebug("Binding camera provider, startRecording=$startRecording")
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)

        cameraProviderFuture.addListener({
            try {
                val cameraProvider = cameraProviderFuture.get()

                // Persistently build use-cases so SurfaceProvider never disconnects
                if (previewUseCase == null) {
                    previewUseCase = Preview.Builder().build()
                }

                activeSurfaceProvider?.let {
                    provider ->
                    previewUseCase?.setSurfaceProvider(provider)
                }

                if (videoCapture == null) {
                    val recorder = Recorder.Builder()
                    .setQualitySelector(QualitySelector.from(currentQuality))
                    .build()
                    videoCapture = VideoCapture.withOutput(recorder)
                }

                val cameraSelector = CameraSelector.Builder()
                .requireLensFacing(lensFacing)
                .build()

                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(this, cameraSelector, videoCapture!!, previewUseCase!!)
                emitDebug("Camera bound successfully to lifecycle")

                if (startRecording) {
                    // Small thread pause to let hardware camera pipeline warm up cleanly
                    metricsExecutor.schedule({
                        if (isIntentionalRecording) {
                            startNewRecordingSegment()
                        }
                    }, 200, TimeUnit.MILLISECONDS)
                }
            } catch (exc: Exception) {
                emitError("Failed to bind camera use cases", exc)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun startNewRecordingSegment() {
        if (!isIntentionalRecording) return
        if (activeRecording != null) {
            emitDebug("Skipping segment creation: activeRecording reference is already occupied.")
            return
        }

        val videoCap = videoCapture
        if (videoCap == null) {
            emitError("Cannot record: videoCapture use case is null", null)
            return
        }

        try {
            val name = SimpleDateFormat("yyyy-MM-dd-HH-mm-ss-SSS", Locale.US).format(System.currentTimeMillis())
            val file = File(getExternalFilesDir(null), "$name.mp4")

            val outputOptions = FileOutputOptions.Builder(file)
            .setFileSizeLimit((maxSizeMB * 1024 * 1024).toLong())
            .setDurationLimitMillis(maxDurationMs)
            .build()

            var pendingRecording = videoCap.output.prepareRecording(this, outputOptions)

            if (!isMuted) {
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    pendingRecording = pendingRecording.withAudioEnabled()
                } else {
                    emitEvent("WARNING", mapOf("message" to "Audio permission missing, recording without audio"))
                }
            }

            emitDebug("Initiating new file segment: ${file.name}")
            activeRecording = pendingRecording.start(ContextCompat.getMainExecutor(this)) {
                recordEvent ->
                when (recordEvent) {
                    is VideoRecordEvent.Finalize -> {
                        val currentFileRef = file
                        activeRecording = null // Free lock immediately on finalize callback

                        if (!recordEvent.hasError() ||
                            recordEvent.error == VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED ||
                            recordEvent.error == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED) {

                            handleFinishedSegment(currentFileRef)
                        } else {
                            val errStr = getVideoRecordErrorString(recordEvent.error)
                            emitError("Recording finalize error: $errStr", recordEvent.cause)

                            // Fail-safe check: Did it actually write data despite error code?
                            if (currentFileRef.exists() && currentFileRef.length() > 0) {
                                handleFinishedSegment(currentFileRef)
                            }
                        }

                        // Auto-segment looping if intentional recording remains active
                        if (instance != null && isIntentionalRecording) {
                            startNewRecordingSegment()
                        }
                    }
                }
            }
        } catch (e: Exception) {
            emitError("Exception while starting recording segment", e)
            activeRecording = null
        }
    }

    private fun getVideoRecordErrorString(error: Int): String {
        return when (error) {
            VideoRecordEvent.Finalize.ERROR_UNKNOWN -> "ERROR_UNKNOWN"
            VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED -> "ERROR_FILE_SIZE_LIMIT_REACHED"
            VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE -> "ERROR_INSUFFICIENT_STORAGE"
            VideoRecordEvent.Finalize.ERROR_INVALID_OUTPUT_OPTIONS -> "ERROR_INVALID_OUTPUT_OPTIONS"
            VideoRecordEvent.Finalize.ERROR_ENCODING_FAILED -> "ERROR_ENCODING_FAILED"
            VideoRecordEvent.Finalize.ERROR_RECORDER_ERROR -> "ERROR_RECORDER_ERROR"
            VideoRecordEvent.Finalize.ERROR_NO_VALID_DATA -> "ERROR_NO_VALID_DATA"
            VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE -> "ERROR_SOURCE_INACTIVE"
            VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED -> "ERROR_DURATION_LIMIT_REACHED"
            else -> "ERROR_CODE_$error"
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
        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK)
            CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
        startCamera(startRecording = isIntentionalRecording)
    }

    fun attachSurfaceProvider(provider: Preview.SurfaceProvider?) {
        activeSurfaceProvider = provider
        ContextCompat.getMainExecutor(this).execute {
            previewUseCase?.setSurfaceProvider(provider)
        }
    }

    fun removeFileFromList(path: String) {
        synchronized(savedFiles) {
            savedFiles.removeAll {
                it.absolutePath == path
            }
        }
    }

    private fun getQualityFromString(qualityStr: String?): Quality {
        return when (qualityStr?.lowercase(Locale.getDefault())) {
            "2160p", "uhd" -> Quality.UHD
            "1080p", "fhd" -> Quality.FHD
            "720p", "hd" -> Quality.HD
            "480p", "sd" -> Quality.SD
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

                emitEvent("SYSTEM_STATS", mapOf(
                    "cpuUsage" to calculateCpuUsageSafely(),
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
        if (file.exists() && file.length() > 0) {
            savedFiles.add(file)
            emitEvent("SEGMENT_FINISHED", mapOf("file" to file.absolutePath, "size" to file.length()))
            manageStorageLoop()
        }
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
        if (!isBatteryReceiverRegistered) {
            registerReceiver(batteryReceiver, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            isBatteryReceiverRegistered = true
        }
    }

    private fun emitEvent(type: String, data: Map<String, Any>) {
        DriveCamModule.instance?.emitCameraEvent(type, data)
    }

    private fun emitDebug(message: String) {
        Log.d("DriveCamService", message)
        emitEvent("DEBUG", mapOf("message" to message, "timestamp" to System.currentTimeMillis()))
    }

    private fun emitError(message: String, throwable: Throwable?) {
        Log.e("DriveCamService", message, throwable)
        val data = mutableMapOf<String, Any>("message" to message, "timestamp" to System.currentTimeMillis())
        if (throwable != null) {
            data["cause"] = throwable.localizedMessage ?: throwable.javaClass.simpleName
            data["stackTrace"] = Log.getStackTraceString(throwable)
        }
        emitEvent("ERROR", data)
    }

    private fun stopRecordingLogic() {
        try {
            activeRecording?.stop()
        } catch (e: Exception) {}
        activeRecording = null
        try {
            ProcessCameraProvider.getInstance(this).get().unbindAll()
            if (autoOptimize && isBatteryReceiverRegistered) {
                unregisterReceiver(batteryReceiver)
                isBatteryReceiverRegistered = false
            }
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