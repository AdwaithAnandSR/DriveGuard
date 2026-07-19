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

    override fun requestLayout() {
        super.requestLayout()
        post {
            val measureSpecWidth = MeasureSpec.makeMeasureSpec(width, MeasureSpec.EXACTLY)
            val measureSpecHeight = MeasureSpec.makeMeasureSpec(height, MeasureSpec.EXACTLY)
            previewView.measure(measureSpecWidth, measureSpecHeight)
            previewView.layout(0, 0, width, height)
        }
    }

    fun setPreviewEnabled(enabled: Boolean) {
        post {
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