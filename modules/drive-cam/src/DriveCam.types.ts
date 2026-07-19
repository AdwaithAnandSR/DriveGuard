export type CameraConfig = {
    maxDurationMs: number;
    maxSizeMB: number;
    maxStorageUsageMB: number;
    autoDelete: boolean;
    autoOptimize: boolean;
    lensFacing: "front" | "back";
    quality?: "2160p" | "1080p" | "720p" | "480p" | "highest" | "lowest"; 
};

export type DriveCamViewProps = {
    /**
     * Set to `false` to disable the UI preview.
     * This drops CPU/GPU usage significantly while background recording continues.
     */
    previewEnabled?: boolean;
    style?: any;
};

// --- NEW: Structure for saved video files ---
export type SavedVideoFile = {
    name: string;
    path: string;
    size: number;        // Size in bytes
    createdAt: number;   // Unix timestamp
};
