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
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

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
    private var isMuted = false
    private var isRecording = false

    private val savedFiles = mutableListOf<File>()
    private var currentQuality = Quality.HIGHEST

    override fun onCreate() {
        super.onCreate()
        instance = this
        cameraExecutor = Executors.newSingleThreadExecutor()
        createNotificationChannel()
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

                startForeground(1, createNotification())
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
            
            val qualitySelector = QualitySelector.from(currentQuality)
            val recorder = Recorder.Builder()
                .setQualitySelector(qualitySelector)
                .build()
                
            videoCapture = VideoCapture.withOutput(recorder)
            
            previewUseCase = Preview.Builder().build()
            previewUseCase?.setSurfaceProvider(activeSurfaceProvider)

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

    fun attachSurfaceProvider(provider: Preview.SurfaceProvider?) {
        previewUseCase?.setSurfaceProvider(provider)
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
            when (recordEvent) {
                is VideoRecordEvent.Start -> {
                    isRecording = true
                    emitEvent("SEGMENT_STARTED", mapOf("file" to file.absolutePath))
                }
                is VideoRecordEvent.Finalize -> {
                    isRecording = false
                    if (!recordEvent.hasError() || recordEvent.error == VideoRecordEvent.Finalize.ERROR_FILE_SIZE_LIMIT_REACHED || recordEvent.error == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED) {
                        handleFinishedSegment(file)
                        // Immediate restart for seamless loop
                        if (instance != null) startNewRecordingSegment()
                    } else {
                        emitEvent("ERROR", mapOf("message" to "Recording finalized with error: ${recordEvent.error}"))
                    }
                }
            }
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
            val size = oldest.length()
            if (oldest.exists()) {
                oldest.delete()
                totalSize -= size
                emitEvent("FILE_DELETED", mapOf("file" to oldest.absolutePath))
            }
        }
    }

    fun muteAudio(mute: Boolean) {
        isMuted = mute
        activeRecording?.mute(mute)
        emitEvent("MUTE_CHANGED", mapOf("isMuted" to isMuted))
    }

    fun flipCamera() {
        activeRecording?.stop() 
        lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
            CameraSelector.LENS_FACING_FRONT
        } else {
            CameraSelector.LENS_FACING_BACK
        }
        startCamera() 
    }

    private fun stopRecordingLogic() {
        activeRecording?.stop()
        activeRecording = null
        val cameraProviderFuture = ProcessCameraProvider.getInstance(this)
        cameraProviderFuture.get().unbindAll()
        if (autoOptimize) {
            try {
                unregisterReceiver(batteryReceiver)
            } catch (e: IllegalArgumentException) {}
        }
    }

    private val batteryReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val temp = intent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) ?: 0
            val celsius = temp / 10.0
            
            if (celsius > 40.0 && currentQuality != Quality.LOWEST) {
                currentQuality = Quality.LOWEST
                emitEvent("OPTIMIZATION_TRIGGERED", mapOf("reason" to "high_temperature", "temp" to celsius))
                activeRecording?.stop()
                startCamera()
            } else if (celsius < 35.0 && currentQuality != Quality.HIGHEST) {
                currentQuality = Quality.HIGHEST
                activeRecording?.stop()
                startCamera()
            }
        }
    }

    private fun registerThermalBatteryReceiver() {
        val filter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
        registerReceiver(batteryReceiver, filter)
    }

    private fun emitEvent(type: String, data: Map<String, Any>) {
        DriveCamModule.instance?.emitCameraEvent(type, data)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Dashcam Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
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
    }
}
