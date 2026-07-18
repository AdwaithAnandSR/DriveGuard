import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mmkvStorage } from "./storage.ts";

export type VideoQuality = "2160p" | "1080p" | "720p" | "480p";

interface SettingsState {
    videoQuality: VideoQuality;
    limitBytes: number;
    limitDuration: number;
    isMuted: boolean;
    autoDelete: boolean;

    setVideoQuality: (quality: VideoQuality) => void;
    setLimitBytes: (bytes: number) => void;
    setLimitDuration: (bytes: number) => void;
    toggleMuted: () => void;
    toggleFullview: () => void;
    toggleAutoDelete: (value: boolean) => void;
}

export const useStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            videoQuality: "1080p",
            limitBytes: 500 * 1024 * 1024,
            limitDuration: 5,
            isMuted: false,
            fullview: false,
            autoDelete: true,

            setVideoQuality: videoQuality => set({ videoQuality }),
            setLimitBytes: limitBytes => set({ limitBytes }),
            setLimitDuration: limitDuration => set({ limitDuration }),
            toggleMuted: () => set({ isMuted: !get().isMuted }),
            toggleFullview: () => set({ fullview: !get().fullview }),
            setAutoDelete: autoDelete => set({ autoDelete })
        }),
        {
            name: "settings",
            storage: createJSONStorage(() => mmkvStorage)
        }
    )
);
