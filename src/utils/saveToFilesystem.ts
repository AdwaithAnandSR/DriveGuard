import { File, Directory, Paths } from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";

import cleanup from "./cleanup.ts";

const save = async (uri: string) => {
    if (!uri) return;

    const recordings = new Directory(Paths.document, "Recordings");
    if (!recordings.exists) recordings.create();

    const source = new File(uri);
    const destination = new File(recordings, source.name);

    source.move(destination);

    const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(
        destination.uri,
        { time: 1000 }
    );

    const tempThumb = new File(thumbUri);
    const thumbnail = new File(
        recordings,
        source.name.replace(/\.[^.]+$/, ".jpg")
    );

    tempThumb.move(thumbnail);
    cleanup();
};

export default save;
