import { useEffect } from "react";
import { StyleSheet, View, Alert, TouchableOpacity, Text } from "react-native";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { useIsFocused } from "expo-router";

import Header from "../components/Header.tsx";
import CameraOptions from "../components/CameraOptions.tsx";

import { useStore } from "../utils/store.ts";
import { CameraView, CamUtils } from "../utils/camera.ts";

export default function App() {
    const showPreview = useStore(state => state.showPreview);
    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    const isFocused = useIsFocused();

    useEffect(() => {
        if (!camPermission) return;

        if (camPermission.granted) {
            CamUtils.startPreview();
            return;
        }

        if (camPermission.canAskAgain) {
            reqPermissions();
            return;
        }

        Alert.alert(
            "Camera permission required",
            "Please enable Camera and Microphone permissions in Settings.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Open Settings",
                    onPress: () => Linking.openSettings()
                }
            ]
        );
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
                {isFocused && (
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
