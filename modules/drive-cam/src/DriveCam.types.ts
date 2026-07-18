export type CameraConfig = {
    maxDurationMs: number;
    maxSizeMB: number;
    maxStorageUsageMB: number;
    autoDelete: boolean;
    autoOptimize: boolean;
    lensFacing: "front" | "back";
};

export type DriveCamViewProps = {
    /**
     * Set to `false` to disable the UI preview.
     * This drops CPU/GPU usage significantly while background recording continues.
     */
    previewEnabled?: boolean;
    style?: any;
};
