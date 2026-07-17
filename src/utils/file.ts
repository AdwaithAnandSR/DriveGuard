import { Directory, Paths, File } from "expo-file-system";

export const list = () => {
    const recordings = new Directory(Paths.document, "Recordings");

    if (!recordings.exists) return [];

    return recordings
        .list()
        .filter(file => file.name.match(/\.(mp4|mov|mkv|webm)$/i))
        .map(file => ({
            uri: file.uri,
            thumbnail: file.uri.replace(/\.[^.]+$/, ".jpg"),
            name: file.name,
            creationTime: file.creationTime,
            size: file.size
        }))
        .sort((a, b) => b.creationTime - a.creationTime);
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
