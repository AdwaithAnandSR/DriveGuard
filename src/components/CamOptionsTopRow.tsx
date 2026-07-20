import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Host, Icon } from "@expo/ui";

import FitScreen from "@expo/material-symbols/fit_screen.xml";
import MicOff from "@expo/material-symbols/mic_off.xml";
import ArrowDown from "@expo/material-symbols/keyboard_arrow_down.xml";
import PreviewOff from "@expo/material-symbols/visibility_off.xml";

import { useStore } from "../utils/store.ts";
import { CamUtils } from "../utils/camera.ts";

const QUALITIES = ["2160p", "1080p", "720p", "480p"];

export default function TopRow() {
    const fullview = useStore(state => state.fullview);
    const toggleFullview = useStore(state => state.toggleFullview);
    const videoQuality = useStore(state => state.videoQuality);
    const setVideoQuality = useStore(state => state.setVideoQuality);
    const isMuted = useStore(state => state.isMuted);
    const toggleMuted = useStore(state => state.toggleMuted);
    const showPreview = useStore(state => state.showPreview);
    const toggleShowPreview = useStore(state => state.toggleShowPreview);

    const [showQuality, setShowQuality] = useState(false);

    const toggleShowQualityOptions = () => setShowQuality(p => !p);

    const setQuality = v => {
        setVideoQuality(v);
        setShowQuality(false);
    };

    const handleMute = async () => {
        const { success } = await CamUtils.muteAudio(isMuted);
        if (success) toggleMuted();
    };

    return (
        <View
            style={[styles.topRowOuter, { paddingTop: fullview ? "8%" : "3%" }]}
        >
            <View style={styles.topRowInner}>
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
                        onPress={handleMute}
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
                        <Text style={{ color: "white" }}>{videoQuality}</Text>
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
                            {QUALITIES.map(i => (
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

            <View style={styles.topRowInner}>
                <Host
                    style={{
                        backgroundColor: showPreview ? "transparent" : "white",
                        borderRadius: 12
                    }}
                    matchContents
                >
                    <Icon
                        style={{
                            padding: 2
                        }}
                        onPress={toggleShowPreview}
                        name={PreviewOff}
                        size={30}
                        color={showPreview ? "white" : "black"}
                    />
                </Host>
                <Host matchContents>
                    <Icon
                        onPress={toggleFullview}
                        name={FitScreen}
                        size={36}
                        color="white"
                    />
                </Host>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topRowOuter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "4%",
        paddingVertical: "3%"
    },
    topRowInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
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
