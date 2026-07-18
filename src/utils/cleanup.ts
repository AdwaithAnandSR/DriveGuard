import { Directory, File, Paths } from "expo-file-system";

import { useStore } from "./store.ts";

const RECORDINGS_DIR = new Directory(Paths.document, "Recordings");

const cleanup = async () => {
    if (!RECORDINGS_DIR.exists) return;
    const autoDelete = useStore.getState().autoDelete;
    if (!autoDelete) return;

    const files = RECORDINGS_DIR.list().filter(
        (item): item is File => item instanceof File
    );

    const videoFiles = files.filter(f => f.type?.startsWith("video/"));
    if (videoFiles.length < 2) return;

    const videos = videoFiles.map(file => ({
        file,
        size: file.size ?? 0,
        created: file.creationTime ?? 0
    }));

    let totalSize = videos.reduce((sum, v) => sum + v.size, 0);
    const limitBytes = useStore.getState().limitBytes;

    if (totalSize <= limitBytes) return;

    videos.sort((a, b) => a.created - b.created);

    for (const video of videos) {
        if (totalSize <= limitBytes) break;

        totalSize -= video.size;
        video.file.delete();

        const thumbnailUri = video.file.uri.replace(/\.[^.]+$/, ".jpg");
        const thumbnailFile = new File(thumbnailUri);
        if (thumbnailFile.exists) thumbnailFile.delete();
    }
};

export default cleanup;
