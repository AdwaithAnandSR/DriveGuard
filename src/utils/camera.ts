import {
    requireNativeModule,
    requireNativeViewManager
} from "expo-modules-core";
import { NativeEventEmitter } from "react-native";
import { Camera } from "expo-camera";

export const DriveCam = requireNativeModule("DriveCam");
export const CameraView = requireNativeViewManager("DriveCam");
// export const CamEmitter = new NativeEventEmitter(DriveCam);

import { useStore } from "./store.ts";

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
            

            const {
                maxStorageUsageMB,
                limitDuration,
                autoDelete,
                autoOptimize,
                lensFacing,
                videoQuality,
                maxVideoSizeInMB
            } = useStore.getState();
            
            const res = await DriveCam.startRecording({
                maxDurationMs: limitDuration * 60 * 1000,
                maxSizeMB: maxVideoSizeInMB,
                maxStorageUsageMB,
                autoDelete,
                autoOptimize,
                lensFacing,
                quality: videoQuality,
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
            await DriveCam.mute(!isMuted);
            return { success: true };
        } catch (error) {
            console.error("Failed to change mute state:", error);
            return { success: false, error: "Failed to mute" };
        }
    },

    async startPreview() {
        try {
            await DriveCam.startPreview();
            return { success: true };
        } catch (error) {
            console.error("Failed to start preview:", error);
            return { success: false, error: "Failed to preview" };
        }
    },

    async shutdownCamera() {
        try {
            await DriveCam.shutdownCamera();
            return { success: true };
        } catch (error) {
            console.error("Failed to shutdown:", error);
            return { success: false, error: "Failed to shutdown" };
        }
    },

    async getFiles() {
        try {
            const files = await DriveCam.getSavedVideoFiles();
            return files;
        } catch (error) {
            console.error("Failed to fetch saved videos:", error);
            return { success: false, error: "Failed to fetch videos" };
        }
    },

    async pause() {
        try {
            await DriveCam.pauseRecording();
            return { success: true };
        } catch (error) {
            console.error("Failed to pause:", error);
            return { success: false, error: "Failed to pause" };
        }
    },

    async resume() {
        try {
            await DriveCam.resumeRecording();
            return { success: true };
        } catch (error) {
            console.error("Failed to resume:", error);
            return { success: false, error: "Failed to resume" };
        }
    },

    async deleteFile(path) {
        try {
            await DriveCam.deleteVideoFile(path);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete:", error);
            return { success: false, error: "Failed to delete" };
        }
    }
};
