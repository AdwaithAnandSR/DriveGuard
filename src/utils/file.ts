import { Directory, Paths, File } from "expo-file-system";
import { CamUtils } from "./camera.ts";

export const list = async () => {
    const { files } = await CamUtils.getFiles();
    return files ?? [];
};

export const deleteSelected = async multiSelectList => {
    await Promise.all(
        multiSelectList.map(async videoUri => {
            const video = new File(videoUri);
            const thumb = new File(videoUri.replace(/\.[^.]+$/, ".jpg"));

            if (video.exists) await video.delete();
            if (thumb.exists) await thumb.delete();
        })
    );
};

export const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;

    const units = ["KB", "MB", "GB", "TB"];
    let size = bytes / 1024;
    let unit = 0;

    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit++;
    }

    return `${size.toFixed(2)} ${units[unit]}`;
};
