import {
    requireNativeModule,
    requireNativeViewManager
} from "expo-modules-core";
import { NativeEventEmitter } from "react-native";
import { Camera } from "expo-camera";

const DriveCam = requireNativeModule("DriveCam");
export const CameraView = requireNativeViewManager("DriveCam");
// export const CamEmitter = new NativeEventEmitter(DriveCam);

export const CamUtils = {
    async startRecording(config: any) {
        try {
            const { status: cameraStatus } =
                await Camera.requestCameraPermissionsAsync();
            const { status: audioStatus } =
                await Camera.requestMicrophonePermissionsAsync();

            if (cameraStatus !== "granted" || audioStatus !== "granted") {
                throw new Error("Permissions not granted for camera or audio");
            }

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

    async stopRecording() {
        try {
            await DriveCam.stopRecording();
            return { success: true };
        } catch (error) {
            console.error("Failed to stop recording:", error);
            return { success: false };
        }
    },

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

//   useEffect(() => {
//     const subscription = driveCamEmitter.addListener('onRecordingEvent', (event) => {
//       event.type, event.data
//     });
//     return () => subscription.remove();
//   }, []);

// <DriveCamView style={{ flex: 1 }} previewEnabled={true} />
