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
        // COMPATIBLE mode is safer for React Native rendering
        implementationMode = PreviewView.ImplementationMode.COMPATIBLE
    }

    init {
        addView(previewView)
    }

    // Inside DriveCamView.kt
    fun setPreviewEnabled(enabled: Boolean) {
        val provider = if (enabled) previewView.surfaceProvider else null
        CameraForegroundService.activeSurfaceProvider = provider
        // Correctly call the method we added in step 1
        CameraForegroundService.instance?.attachSurfaceProvider(provider)
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        // Prevent memory leaks when the UI unmounts
        CameraForegroundService.activeSurfaceProvider = null
        CameraForegroundService.instance?.attachSurfaceProvider(null)
    }
}
