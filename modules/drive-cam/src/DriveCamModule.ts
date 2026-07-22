import { requireNativeModule, Subscription } from "expo-modules-core";
import {
    CameraConfig,
    SavedVideoFile,
    CameraEventPayload
} from "./DriveCam.types";

// 1. Get the module
const DriveCamModule = requireNativeModule("DriveCam");

export function startPreview(): boolean {
    return DriveCamModule.startPreview();
}

export function shutdownCamera(): boolean {
    return DriveCamModule.shutdownCamera();
}

export function getSavedVideoFiles(): SavedVideoFile[] {
    return DriveCamModule.getSavedVideoFiles();
}

export function deleteVideoFile(filePath: string): boolean {
    return DriveCamModule.deleteVideoFile(filePath);
}

export function startRecording(config: CameraConfig): boolean {
    return DriveCamModule.startRecording(config);
}

export function stopRecording(): boolean {
    return DriveCamModule.stopRecording();
}

export function pauseRecording(): boolean {
    return DriveCamModule.pauseRecording();
}

export function resumeRecording(): boolean {
    return DriveCamModule.resumeRecording();
}

export function mute(isMuted: boolean): boolean {
    return DriveCamModule.mute(isMuted);
}

export function flipCamera(): boolean {
    return DriveCamModule.flipCamera();
}

// 2. Direct listener attachment with strong typing
export function addRecordingEventListener(
    listener: (event: CameraEventPayload) => void
): Subscription {
    return DriveCamModule.addListener("onRecordingEvent", listener);
}

export default DriveCamModule;
