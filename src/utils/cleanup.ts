import { Directory, File } from "expo-file-system";

const RECORDINGS_DIR = new Directory(Paths.document, "Recordings");

const MB = 1024 * 1024;
const GB = MB * 1024;

const limitBytes = 1 * GB;

const cleanup = async () => {
    if (!RECORDINGS_DIR.exists) return;

    const files = RECORDINGS_DIR.list().filter(
        (item): item is File => item instanceof File
    );

    const videos = files.map(file => ({
        file,
        size: file.size ?? 0,
        created: file.creationTime ?? 0
    }));

    let totalSize = videos.reduce((sum, v) => sum + v.size, 0);

    if (totalSize <= limitBytes) return;

    // Oldest first
    videos.sort((a, b) => a.created - b.created);

    for (const video of videos) {
        if (totalSize <= limitBytes) break;

        totalSize -= video.size;
        video.file.delete();
    }
};

export default cleanup;
