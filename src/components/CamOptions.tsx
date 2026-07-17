import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const Options = ({
    camPermission,
    micPermission,
    videoQuality,
    changeVideoQuality,
    toggleFullView,
    fullview,
    toggleMic,
    muted,
    togglePreview,
    preview
}) => {
    const [showQuality, setShowQuality] = useState(false);

    const toggleShowQualityOptions = () => setShowQuality(p => !p);

    const setQuality = v => {
        changeVideoQuality(v);
        setShowQuality(false);
    };

    return (
        <>
            <View
                style={{
                    position: "absolute",
                    flexDirection: "row",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "2%",
                    paddingTop: fullview ? "10%" : "2%"
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 10
                    }}
                >
                    <TouchableOpacity
                        onPress={toggleMic}
                        style={{
                            backgroundColor: !micPermission?.granted
                                ? "red"
                                : muted
                                  ? "grey"
                                  : "green",
                            padding: 8,
                            borderRadius: 16
                        }}
                    >
                        <Text style={styles.optionBtn}>🎙️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={togglePreview}
                        style={{
                            backgroundColor: !camPermission.granted
                                ? "red"
                                : preview
                                  ? "green"
                                  : "grey",
                            padding: 8,
                            borderRadius: 16
                        }}
                    >
                        <Text style={styles.optionBtn}>📺</Text>
                    </TouchableOpacity>
                    <View style={{ gap: 2 }}>
                        <TouchableOpacity
                            onPress={toggleShowQualityOptions}
                            style={styles.videoQuality}
                        >
                            <Text style={{ color: "white" }}>
                                {videoQuality}
                            </Text>
                            <Text
                                style={{
                                    transform: [{ rotateZ: "90deg" }],
                                    color: "white",
                                    fontSize: 18
                                }}
                            >
                                {">"}
                            </Text>
                        </TouchableOpacity>
                        {showQuality && (
                            <View
                                style={{
                                    alignItems: "center",
                                    backgroundColor: "#1717176f",
                                    borderRadius: 15,
                                    paddingHorizontal: 12,
                                    paddingVertical: 5,
                                    gap: 6
                                }}
                            >
                                {["2160", "1080", "720", "480"].map(i => (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setQuality(i + "p")}
                                    >
                                        <Text
                                            style={{
                                                color: "white",
                                                fontSize: 15
                                            }}
                                        >
                                            {i}p
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    onPress={toggleFullView}
                    style={{
                        padding: 8,
                        borderRadius: 16,
                        backgroundColor: "#1717176f"
                    }}
                >
                    <Text style={styles.optionBtn}>💢</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    optionBtnContainer: {
        padding: 8,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        backgroundColor: "#7a7a7a99",
        top: "1%"
    },
    optionBtn: {
        fontWeight: "bold",
        fontSize: 18,
        color: "green"
    },
    videoQuality: {
        padding: 8,
        borderRadius: 16,
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1717176f"
    }
});

export default Options;
