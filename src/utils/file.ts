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

export const deleteSelected = async (multiSelectList) => {
    await Promise.all(
        multiSelectList.map(async videoUri => {
            const video = new File(videoUri);
            const thumb = new File(videoUri.replace(/\.[^.]+$/, ".jpg"));

            if (video.exists) await video.delete();
            if (thumb.exists) await thumb.delete();
        })
    );
};
