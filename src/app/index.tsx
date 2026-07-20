import { useEffect, useRef } from "react";
import { StyleSheet, View, Alert, TouchableOpacity, Text } from "react-native";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { router, useIsFocused } from "expo-router";

import Header from "../components/Header.tsx";
import CameraOptions from "../components/CameraOptions.tsx";

import { useStore } from "../utils/store.ts";
import { CameraView, CamUtils, DriveCam } from "../utils/camera.ts";

import { useEventListener } from "expo";

export default function App() {
    const fullview = useStore(state => state.fullview);
    const showPreview = useStore(state => state.showPreview);
    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    const requested = useRef(false);
    const isFocused = useIsFocused();

    useEventListener(DriveCam, "onRecordingEvent", event => {
        const { type, data } = event;

        switch (type) {
            case "DEBUG":
                console.log(
                    `[DriveCam Debug] 🪲 ${data.message}`,
                    new Date(data.timestamp).toLocaleTimeString()
                );
                break;

            case "ERROR":
                console.error(
                    `[DriveCam Error] ❌ ${data.message}`,
                    data.cause || ""
                );
                if (data.stackTrace) console.debug(data.stackTrace);
                break;

            case "SEGMENT_FINISHED":
                console.log(
                    `[Segment Saved] 💾 File: ${data.file}, Size: ${(data.size / 1024 / 1024).toFixed(2)} MB`
                );
                break;

            case "SYSTEM_STATS":
                // Optional: Monitor CPU load and battery temperature updates every 3s
                // console.log(`[Stats] CPU: ${data.cpuUsage.toFixed(1)}% | Battery: ${data.batteryTemperature}°C`);
                break;

            default:
                console.log(`[DriveCam Event: ${type}]`, data);
        }
    });

    // index.tsx — drop the showPreview gate, start whenever permission is granted
    useEffect(() => {
        if (!camPermission) return;

        const fun = async () => {
            if (camPermission.granted) {
                CamUtils.startPreview();
            } else if (camPermission.canAskAgain) {
                await reqPermissions();
            } else {
                Alert.alert(
                    "Camera permission required",
                    "Please enable Camera and Microphone permissions in Settings.",
                    [
                        { text: "Cancel", style: "cancel" },
                        {
                            text: "Open Settings",
                            onPress: Linking.openSettings()
                        }
                    ]
                );
            }
        };
        fun();
    }, [camPermission]);

    if (!camPermission)
        return <View style={[styles.camera, { height: "100%" }]} />;

    const reqPermissions = () => {
        requestCamPermission();
        requestMicPermission();
    };

    return (
        <View style={styles.container}>
            <Header />

            <View style={{ flex: 1 }}>
                {isFocused && showPreview && (
                    <CameraView
                        style={styles.camera}
                        previewEnabled={showPreview}
                    />
                )}

                {camPermission.granted ? (
                    <CameraOptions />
                ) : (
                    <TouchableOpacity
                        style={styles.requestPermissionContainer}
                        onPress={reqPermissions}
                    >
                        <Text style={styles.requestPermissionText}>
                            Grant Permission
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black"
    },
    camera: {
        flex: 1
    },
    requestPermissionText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 30,
        textAlign: "center"
    },
    requestPermissionContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingTop: 50,
        alignItems: "center"
    }
});
