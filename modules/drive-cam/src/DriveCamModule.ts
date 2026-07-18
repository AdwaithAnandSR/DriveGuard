import { requireNativeModule, EventEmitter } from "expo-modules-core";
import { CameraConfig } from "./DriveCam.types";

const DriveCamModule = requireNativeModule("DriveCam");
const emitter = new EventEmitter(DriveCamModule);

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

export function addRecordingEventListener(listener: (event: any) => void) {
    return emitter.addListener("onRecordingEvent", listener);
}

export default DriveCamModule;
