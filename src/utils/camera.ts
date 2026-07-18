import { requireNativeModule } from "expo-modules-core";
import * as Camera from "expo-camera"; // Assuming expo-camera for permissions

const DriveCam = requireNativeModule("DriveCam");

export const CamUtils = {
    /**
     * Safe wrapper to start recording
     */
    async startRecording(config: any) {
        try {
            // 1. Check for necessary permissions first
            // const { status: cameraStatus } =
            //     await Camera.requestCameraPermissionsAsync();
            // const { status: audioStatus } =
            //     await Camera.requestMicrophonePermissionsAsync();

            // if (cameraStatus !== "granted" || audioStatus !== "granted") {
            //     throw new Error("Permissions not granted for camera or audio");
            // }

            // 2. Call the native module
            await DriveCam.startRecording({
                maxDurationMs: 60000,
                maxSizeMB: 100,
                autoDelete: true,
                autoOptimize: false,
                lensFacing: "back",
                ...config // Allow overrides
            });

            return { success: true };
        } catch (error) {
            console.error("Failed to start recording:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            };
        }
    },

    /**
     * Safe wrapper for stopping recording
     */
    async stopRecording() {
        try {
            await DriveCam.stopRecording();
            return { success: true };
        } catch (error) {
            console.error("Failed to stop recording:", error);
            return { success: false };
        }
    },

    /**
     * Toggle camera direction
     */
    async flipCamera() {
        try {
            await DriveCam.flipCamera();
            return { success: true };
        } catch (error) {
            console.error("Error flipping camera:", error);
            return { success: false };
        }
    },

    async muteAudio(isMuted: boolean) {
        try {
            await DriveCam.mute(isMuted);
            return { success: true };
        } catch (error) {
            console.error("Failed to change mute state:", error);
            return { success: false, error: "Failed to mute" };
        }
    }
};
