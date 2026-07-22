import { requireNativeViewManager } from "expo-modules-core";
import * as React from "react";
import { DriveCamViewProps } from "./DriveCam.types";

const NativeView: React.ComponentType<DriveCamViewProps> =
    requireNativeViewManager("DriveCam");

export default function DriveCamView(props: DriveCamViewProps) {
    // Default to true if the prop isn't explicitly passed
    const enabled = props.previewEnabled ?? true;
    return <NativeView {...props} previewEnabled={enabled} />;
}
