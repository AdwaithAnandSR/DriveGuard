import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage, storage } from "./storage.ts";

export type VideoQuality = "2160p" | "1080p" | "720p" | "480p";
export type LensFacing = "back" | "front";

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

    setVideoQuality: (quality: VideoQuality) => void;
    setMaxStorageUsageMB: (bytes: number) => void;
    setMaxVideoSizeInMB: (mb: number) => void;
    setLimitDuration: (bytes: number) => void;
    setRecording: (value: boolean) => void;
    setPaused: (value: boolean) => void;
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
            showPreview: false,

            setVideoQuality: videoQuality => set({ videoQuality }),
            setMaxStorageUsageMB: maxStorageUsageMB =>
                set({ maxStorageUsageMB }),
            setMaxVideoSizeInMB: maxVideoSizeInMB => set({ maxVideoSizeInMB }),
            setLimitDuration: limitDuration => set({ limitDuration }),
            setRecording: isRecording => set({ isRecording }),
            setPaused: paused => set({ paused }),
            setAutoDelete: autoDelete => set({ autoDelete }),
            setAutoOptimize: autoOptimize => set({ autoOptimize }),
            toggleFullview: () => set({ fullview: !get().fullview }),
            toggleMuted: () => set({ isMuted: !get().isMuted }),
            toggleLensFacing: () => set({ lensFacing: !get().lensFacing }),
            toggleShowPreview: () => set({ showPreview: !get().showPreview })
        }),
        {
            name: "settings",
            storage: createJSONStorage(() => mmkvStorage),
            partialize: state => ({
                videoQuality: state.videoQuality,
                maxStorageUsageMB: state.maxStorageUsageMB,
                limitDuration: state.limitDuration,
                isMuted: state.isMuted,
                autoDelete: state.autoDelete,
                autoOptimize: state.autoOptimize,
                lensFacing: state.lensFacing,
                showPreview: state.showPreview
            })
        }
    )
);
