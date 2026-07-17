import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";

const VideoPlayer = () => {
    const { uri } = useLocalSearchParams<{ uri: string }>();

    const player = useVideoPlayer(uri, player => {
        player.loop = false;
        player.play();
    });

    return (
        <View style={styles.container}>
            <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                nativeControls
                contentFit="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black"
    },
    video: {
        flex: 1
    }
});

export default VideoPlayer;
