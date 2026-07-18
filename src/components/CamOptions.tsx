import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Host, Icon } from "@expo/ui";
import FitScreen from "@expo/material-symbols/fit_screen.xml";
import MicOff from "@expo/material-symbols/mic_off.xml";
import ArrowDown from "@expo/material-symbols/keyboard_arrow_down.xml";

import { useStore } from "../utils/store.ts";

const Options = ({ camPermission, micPermission, isRecording }) => {
    const [showQuality, setShowQuality] = useState(false);

    const videoQuality = useStore(state => state.videoQuality);
    const setVideoQuality = useStore(state => state.setVideoQuality);
    const isMuted = useStore(state => state.isMuted);
    const toggleMuted = useStore(state => state.toggleMuted);
    const fullview = useStore(state => state.fullview);
    const toggleFullview = useStore(state => state.toggleFullview);

    const toggleShowQualityOptions = () => setShowQuality(p => !p);

    const setQuality = v => {
        setVideoQuality(v);
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
                    padding: "3%",
                    paddingTop: fullview ? "10%" : "2%"
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10
                    }}
                >
                    <Host
                        style={{
                            backgroundColor: isMuted ? "white" : "transparent",
                            borderRadius: 12
                        }}
                        matchContents
                    >
                        <Icon
                            style={{
                                padding: 2
                            }}
                            onPress={() => !isRecording && toggleMuted()}
                            name={MicOff}
                            size={30}
                            color={isMuted ? "black" : "white"}
                        />
                    </Host>

                    <View style={{ gap: 2 }}>
                        <TouchableOpacity
                            onPress={toggleShowQualityOptions}
                            style={styles.videoQuality}
                        >
                            <Text style={{ color: "white" }}>
                                {videoQuality}
                            </Text>
                            <Host matchContents>
                                <Icon
                                    onPress={toggleShowQualityOptions}
                                    name={ArrowDown}
                                    size={30}
                                    color="white"
                                />
                            </Host>
                        </TouchableOpacity>
                        {showQuality && (
                            <View
                                style={{
                                    position: "absolute",
                                    top: "105%",
                                    width: "100%",
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

                <Host matchContents>
                    <Icon
                        onPress={toggleFullview}
                        name={FitScreen}
                        size={38}
                        tintColor={"red"}
                        color="white"
                    />
                </Host>
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
        padding: 5,
        borderRadius: 16,
        flexDirection: "row",
        gap: 4,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1717176f"
    }
});

export default Options;
