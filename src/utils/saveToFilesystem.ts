import { File, Directory, Paths } from "expo-file-system";

const save = async (uri: string) => {
    if (!uri) return;

    const recordings = new Directory(Paths.document, "Recordings");
    if (!recordings.exists) {
        recordings.create();
    }

    const source = new File(uri);
    const destination = new File(recordings, source.name);

    source.move(destination);
};

export default save;
