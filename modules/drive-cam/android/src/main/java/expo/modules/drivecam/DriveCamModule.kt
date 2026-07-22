package expo.modules.drivecam

import android.content.Intent
import android.os.Build
import java.io.File
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

        View(DriveCamView::class) {
            Prop("previewEnabled") {
                view: DriveCamView, enabled: Boolean ->
                view.setPreviewEnabled(enabled)
            }
        }

        Function("startPreview") {
            val context = appContext.reactContext ?: return@Function false
            val intent = Intent(context, CameraForegroundService::class.java).apply {
                action = CameraForegroundService.ACTION_START_PREVIEW
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            return@Function true
        }

        Function("shutdownCamera") {
            val context = appContext.reactContext ?: return@Function false
            val intent = Intent(context, CameraForegroundService::class.java).apply {
                action = CameraForegroundService.ACTION_SHUTDOWN
            }
            context.startService(intent)
            return@Function true
        }

        Function("startRecording") {
            config: Map<String, Any> ->
            val context = appContext.reactContext
            if (context != null) {
                val intent = Intent(context, CameraForegroundService::class.java).apply {
                    action = CameraForegroundService.ACTION_START_RECORDING
                    putExtra("maxDurationMs", (config["maxDurationMs"] as? Number)?.toLong() ?: 60000L)
                    putExtra("maxSizeMB", (config["maxSizeMB"] as? Number)?.toInt() ?: 100)
                    putExtra("maxStorageUsageMB", (config["maxStorageUsageMB"] as? Number)?.toInt() ?: 1000)
                    putExtra("autoDelete", config["autoDelete"] as? Boolean ?: true)
                    putExtra("autoOptimize", config["autoOptimize"] as? Boolean ?: false)
                    putExtra("lensFacing", config["lensFacing"] as? String ?: "back")
                    putExtra("quality", config["quality"] as? String ?: "highest")
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                true
            } else {
                false
            }
        }

        Function("stopRecording") {
            val context = appContext.reactContext
            if (context != null) {
                val intent = Intent(context, CameraForegroundService::class.java).apply {
                    action = CameraForegroundService.ACTION_STOP_RECORDING
                }
                context.startService(intent)
                true
            } else {
                false
            }
        }

        // FIX: Added missing braces and return value
        Function("pauseRecording") {
            CameraForegroundService.instance?.pauseRecording()
            true
        }

        Function("resumeRecording") {
            CameraForegroundService.instance?.resumeRecording()
            true
        }

        Function("mute") {
            isMuted: Boolean ->
            CameraForegroundService.instance?.muteAudio(isMuted)
            true
        }

        Function("flipCamera") {
            val service = CameraForegroundService.instance
            if (service != null) {
                service.flipCamera()
                true
            } else {
                false
            }
        }


        Function("getSavedVideoFiles") {
            val context = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
            val dir = context.getExternalFilesDir(null)

            val files = dir?.listFiles {
                _, name -> name.endsWith(".mp4")
            } ?: emptyArray()

            return@Function files.sortedByDescending {
                it.lastModified()
            }
            .map {
                file ->
                mapOf(
                    "name" to file.name,
                    "path" to file.absolutePath,
                    "size" to file.length(),
                    "createdAt" to file.lastModified()
                )
            }
        }

        Function("deleteVideoFile") {
            filePath: String ->
            val file = File(filePath)
            if (file.exists()) {
                val deleted = file.delete()
                if (deleted) {
                    CameraForegroundService.instance?.removeFileFromList(filePath)
                    true
                } else {
                    false
                }
            } else {
                CameraForegroundService.instance?.removeFileFromList(filePath)
                true
            }
        }
    }

    fun emitCameraEvent(eventName: String, data: Map<String, Any>) {
        sendEvent("onRecordingEvent", mapOf(
            "type" to eventName,
            "data" to data
        ))
    }
}