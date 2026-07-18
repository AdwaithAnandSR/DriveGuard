package expo.modules.drivecam

import android.content.Context
import android.widget.FrameLayout
import androidx.camera.view.PreviewView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

class DriveCamView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    
    private val previewView = PreviewView(context).apply {
        layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
    }

    init {
        addView(previewView)
    }

    fun setPreviewEnabled(enabled: Boolean) {
        // Run on the UI layout poster queue to eliminate black screens caused by thread collisions
        previewView.post {
            val provider = if (enabled) previewView.surfaceProvider else null
            CameraForegroundService.activeSurfaceProvider = provider
            CameraForegroundService.instance?.attachSurfaceProvider(provider)
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        CameraForegroundService.activeSurfaceProvider = null
        CameraForegroundService.instance?.attachSurfaceProvider(null)
    }
}
