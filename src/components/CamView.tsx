import { useState, useRef } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    CameraView,
    CameraType,
    useCameraPermissions,
    useMicrophonePermissions,
    Camera
} from "expo-camera";
import { router } from "expo-router";

import Options from "./CamOptions.tsx";

import saveToFilesystem from "../utils/saveToFilesystem.ts";

const CamView = ({ fullview, toggleFullView }) => {
    const [facing, setFacing] = useState<CameraType>("back");
    const [muted, setMuted] = useState(false);
    const [videoQuality, setVideoQuality] = useState("2160p");
    const [isRecording, setRecording] = useState(false);
    const [paused, setPaused] = useState(false);
    const [preview, setPreview] = useState(true);

    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    const cameraRef = useRef(null);
    const features = useRef(null);
    const recordingRef = useRef(false);

    if (!camPermission) return <View />;

    const toggleCameraFacing = () =>
        setFacing(current => (current === "back" ? "front" : "back"));

    const reqPermissions = () => {
        requestCamPermission();
        requestMicPermission();
    };

    const fetch = async () => {
        features.current = await cameraRef?.current?.getSupportedFeatures();
    };

    const togglePreview = () => {
        if (preview) {
            setPreview(false);
            cameraRef.current.pausePreview();
        } else {
            setPreview(true);
            cameraRef.current.resumePreview();
        }
    };

    const startRecord = async () => {
        while (recordingRef.current) {
            const { uri } = await cameraRef.current.recordAsync({
                maxDuration: 600
            });

            await saveToFilesystem(uri);
        }
    };

    const toggleRecord = async () => {
        if (recordingRef.current) {
            recordingRef.current = false;
            setRecording(false);
            await cameraRef.current.stopRecording();
        } else {
            recordingRef.current = true;
            setRecording(true);
            startRecord(); // don't await
        }
    };

    const toggleMic = () => setMuted(p => !p);

    const togglePause = () => {
        cameraRef.current.toggleRecordingAsync();
        setPaused(p => !p);
    };

    const changeVideoQuality = v => setVideoQuality(v);

    return (
        <View style={styles.camContainer}>
            {!camPermission.granted ? (
                <View style={styles.camera}>
                    <TouchableOpacity onPress={reqPermissions}>
                        <Text style={styles.camReqPText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <CameraView
                    ref={cameraRef}
                    style={[
                        styles.camera,
                        { height: fullview ? "100%" : "85%" }
                    ]}
                    facing={facing}
                    mode={"video"}
                    mute={muted}
                    videoQuality={videoQuality}
                    onCameraReady={fetch}
                    // videoStabilizationMode 'off' | 'standard' | 'cinematic' | 'auto'
                />
            )}

            <Options
                camPermission={camPermission}
                micPermission={micPermission}
                videoQuality={videoQuality}
                changeVideoQuality={changeVideoQuality}
                toggleFullView={toggleFullView}
                fullview={fullview}
                muted={muted}
                toggleMic={toggleMic}
                togglePreview={togglePreview}
                preview={preview}
            />

            <TouchableOpacity
                onPress={toggleRecord}
                style={[
                    styles.recordOuter,
                    { bottom: fullview ? "5%" : "18%" }
                ]}
            >
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

            {features?.current?.toggleRecordingAsyncAvailable &&
                isRecording && (
                    <TouchableOpacity
                        onPress={togglePause}
                        style={[
                            styles.recordOuter,
                            { left: "25%", bottom: fullview ? "5%" : "18%" }
                        ]}
                    >
                        <Text style={{ fontSize: 25 }}>
                            {paused ? "▶️" : "⏸️"}
                        </Text>
                    </TouchableOpacity>
                )}

            <TouchableOpacity
                style={[
                    styles.recordOuter,
                    { left: "75%", bottom: fullview ? "5%" : "18%" }
                ]}
                onPress={toggleCameraFacing}
            >
                <Text style={{ fontSize: 25 }}>🐬</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/Gallery")}>
                <Text style={{ fontSize: 35, padding: 20 }}>🖼️</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    camContainer: {
        flex: 1,
        paddingHorizontal: "1%"
    },
    camera: {
        width: "100%",
        borderRadius: 22,
        backgroundColor: "#32323299",
        justifyContent: "center"
    },
    camReqPText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
        textAlign: "center"
    },
    recordOuter: {
        width: 60,
        height: 60,
        borderRadius: 60,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",

        left: "50%",
        transform: [{ translateX: -25 }]
    },
    recordInner: {
        backgroundColor: "red"
    },
    button: {
        alignItems: "center"
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white"
    }
});

export default CamView;
