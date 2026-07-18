package expo.modules.drivecam

import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DriveCamModule : Module() {
    
    companion object {
        var instance: DriveCamModule? = null
    }

    override fun definition() = ModuleDefinition {
        Name("DriveCam")
        
        Events("onRecordingEvent")

        OnCreate {
            instance = this@DriveCamModule
        }

        OnDestroy {
            instance = null
        }

        // Register the native view for the camera preview
        View(DriveCamView::class) {
            Prop("previewEnabled") { view: DriveCamView, enabled: Boolean ->
                view.setPreviewEnabled(enabled)
            }
        }

        Function("startRecording") { config: Map<String, Any> ->
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(context, CameraForegroundService::class.java).apply {
                action = CameraForegroundService.ACTION_START
                putExtra("maxDurationMs", (config["maxDurationMs"] as? Double)?.toLong() ?: 60000L)
                putExtra("maxSizeMB", (config["maxSizeMB"] as? Double)?.toInt() ?: 100)
                putExtra("maxStorageUsageMB", (config["maxStorageUsageMB"] as? Double)?.toInt() ?: 1000)
                putExtra("autoDelete", config["autoDelete"] as? Boolean ?: true)
                putExtra("autoOptimize", config["autoOptimize"] as? Boolean ?: false)
                putExtra("lensFacing", config["lensFacing"] as? String ?: "back")
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        Function("stopRecording") {
            val context = appContext.reactContext ?: return@Function
            val intent = Intent(context, CameraForegroundService::class.java).apply {
                action = CameraForegroundService.ACTION_STOP
            }
            context.startService(intent)
        }

        Function("mute") { isMuted: Boolean ->
            CameraForegroundService.instance?.muteAudio(isMuted)
        }

        Function("flipCamera") {
            CameraForegroundService.instance?.flipCamera()
        }
    }

    fun emitCameraEvent(eventName: String, data: Map<String, Any>) {
        sendEvent("onRecordingEvent", mapOf(
            "type" to eventName,
            "data" to data
        ))
    }
}
