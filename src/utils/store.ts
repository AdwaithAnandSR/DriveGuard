import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage, storage } from "./storage.ts";

export type VideoQuality = "2160p" | "1080p" | "720p" | "480p";
export type LensFacing = "back" | "front";

interface VideoItem {
    path: string;
    name: string;
    createdAt: number;
    size: number;
}

interface SettingsState {
    videoQuality: VideoQuality;
    maxStorageUsageMB: number;
    maxVideoSizeInMB: number;
    limitDuration: number;
    isMuted: boolean;
    paused: boolean;
    fullview: boolean;
    isRecording: boolean;
    autoDelete: boolean;
    autoOptimize: boolean;
    lensFacing: LensFacing;
    showPreview: boolean;
    files: VideoItem[];

    setVideoQuality: (quality: VideoQuality) => void;
    setMaxStorageUsageMB: (bytes: number) => void;
    setMaxVideoSizeInMB: (mb: number) => void;
    setLimitDuration: (bytes: number) => void;
    setRecording: (value: boolean) => void;
    setPaused: (value: boolean) => void;
    setFiles: (files: VideoItem[]) => void;
    deleteFile: (path: string) => void;
    setAutoDelete: (value: boolean) => void;
    setAutoOptimize: (value: boolean) => void;
    toggleShowPreview: () => void;
    toggleMuted: () => void;
    toggleFullview: () => void;
    toggleLensFacing: () => void;
}

export const useStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            videoQuality: "1080p",
            maxStorageUsageMB: 500,
            maxVideoSizeInMB: 500,
            limitDuration: 5, // in min
            isMuted: false,
            fullview: false,
            isRecording: false,
            autoOptimize: true,
            autoDelete: true,
            paused: false,
            lensFacing: "back",
            showPreview: true,
            files: [],

            setVideoQuality: videoQuality => set({ videoQuality }),
            setMaxStorageUsageMB: maxStorageUsageMB =>
                set({ maxStorageUsageMB }),
            setMaxVideoSizeInMB: maxVideoSizeInMB => set({ maxVideoSizeInMB }),
            setLimitDuration: limitDuration => set({ limitDuration }),
            setRecording: isRecording => set({ isRecording }),
            setPaused: paused => set({ paused }),
            setFiles: files => set({ files }),
            deleteFile: path =>
                set(state => ({
                    files: state.files.filter(file => file.path !== path)
                })),
            setAutoDelete: autoDelete => set({ autoDelete }),
            setAutoOptimize: autoOptimize => set({ autoOptimize }),
            toggleFullview: () => set({ fullview: !get().fullview }),
            toggleMuted: () => set({ isMuted: !get().isMuted }),
            toggleLensFacing: () =>
                set({
                    lensFacing: get().lensFacing === "back" ? "front" : "back"
                }),
            toggleShowPreview: () => set({ showPreview: !get().showPreview })
        }),
        {
            name: "DriveCam",
            storage: createJSONStorage(() => mmkvStorage),
            partialize: state => ({
                videoQuality: state.videoQuality,
                maxStorageUsageMB: state.maxStorageUsageMB,
                maxVideoSizeInMB: state.maxVideoSizeInMB,
                limitDuration: state.limitDuration,
                autoDelete: state.autoDelete,
                autoOptimize: state.autoOptimize,
                lensFacing: state.lensFacing,
                showPreview: state.showPreview
            })
        }
    )
);
