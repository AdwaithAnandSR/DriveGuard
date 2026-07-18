import { requireNativeModule, EventEmitter } from "expo-modules-core";
import { CameraConfig } from "./DriveCam.types";

const DriveCamModule = requireNativeModule("DriveCam");
const emitter = new EventEmitter(DriveCamModule);

export function startRecording(config: CameraConfig) {
    return DriveCamModule.startRecording(config);
}

export function stopRecording() {
    return DriveCamModule.stopRecording();
}

export function mute(isMuted: boolean) {
    return DriveCamModule.mute(isMuted);
}

export function flipCamera() {
    return DriveCamModule.flipCamera();
}

export function addRecordingEventListener(listener: (event: any) => void) {
    return emitter.addListener("onRecordingEvent", listener);
}

export default DriveCamModule;
