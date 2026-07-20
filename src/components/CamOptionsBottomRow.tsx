import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Host, Icon } from "@expo/ui";
import { router } from "expo-router";

import FlipCam from "@expo/material-symbols/flip_camera_ios.xml";
import PhotoLib from "@expo/material-symbols/photo_library.xml";
import Pause from "@expo/material-symbols/pause.xml";
import Play from "@expo/material-symbols/play_arrow.xml";

import { useStore } from "../utils/store.ts";
import { CamUtils } from "../utils/camera.ts";

export default function BottomRow() {
    const isRecording = useStore(state => state.isRecording);
    const setRecording = useStore(state => state.setRecording);
    const paused = useStore(state => state.paused);
    const setPaused = useStore(state => state.setPaused);
    const toggleLensFacing = useStore(state => state.toggleLensFacing);

    const toggleCameraFacing = async () => {
        toggleLensFacing();
        await CamUtils.flipCamera();
    };

    const toggleRecord = async () => {
        if (isRecording) {
            await CamUtils.stopRecording();
            setRecording(false); // Only set false if stop was successful
        } else {
            const res = await CamUtils.startRecording({});
            if (res.success) {
                setRecording(true); // Only set true if start was successful
            } else {
                alert("Could not start recording");
            }
        }
    };

    const togglePause = async () => {
        if (paused) {
            await CamUtils.resume();
            setPaused(false);
        } else {
            await CamUtils.pause();
            setPaused(true);
        }
    };

    return (
        <View style={styles.row}>
            {/* left */}
            <View>
                {isRecording ? (
                    <Host matchContents>
                        <Icon
                            onPress={togglePause}
                            name={paused ? Play : Pause}
                            size={paused ? 45 : 40}
                            color="white"
                        />
                    </Host>
                ) : (
                    <Host matchContents>
                        <Icon
                            onPress={() => router.push("/Gallery")}
                            name={PhotoLib}
                            size={30}
                            color="white"
                        />
                    </Host>
                )}
            </View>

            {/* center */}
            <TouchableOpacity onPress={toggleRecord} style={styles.recordOuter}>
                <View
                    style={[
                        styles.recordInner,
                        {
                            borderRadius: isRecording ? 10 : 60,
                            height: isRecording ? 40 : 55,
                            width: isRecording ? 40 : 55
                        }
                    ]}
                />
            </TouchableOpacity>

            {/* right */}
            <Host matchContents>
                <Icon
                    onPress={toggleCameraFacing}
                    name={FlipCam}
                    size={35}
                    color="white"
                />
            </Host>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: "15%",
        paddingVertical: "3%"
    },
    recordOuter: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center"
    },
    recordInner: {
        backgroundColor: "#fc1b1b"
    }
});
