import { useState, useRef } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    
    CameraType,
    useCameraPermissions,
    useMicrophonePermissions,
    Camera
} from "expo-camera";
import { router, useIsFocused } from "expo-router";
import { Host, Icon } from "@expo/ui";
import FlipCam from "@expo/material-symbols/flip_camera_ios.xml";
import PhotoLib from "@expo/material-symbols/photo_library.xml";
import Pause from "@expo/material-symbols/pause.xml";
import Play from "@expo/material-symbols/play_arrow.xml";

import Options from "./CamOptions.tsx";

import saveToFilesystem from "../utils/saveToFilesystem.ts";
import { useStore } from "../utils/store.ts";
import { CameraView } from "../utils/camera.ts";

const CamView = () => {
    const [facing, setFacing] = useState<CameraType>("back");
    const [isRecording, setRecording] = useState(false);
    const [paused, setPaused] = useState(false);

    const [camPermission, requestCamPermission] = useCameraPermissions();
    const [micPermission, requestMicPermission] = useMicrophonePermissions();

    const isFocused = useIsFocused();

    const videoQuality = useStore(state => state.videoQuality);
    const limitDuration = useStore(state => state.limitDuration);
    const limitBytes = useStore(state => state.limitBytes);
    const isMuted = useStore(state => state.isMuted);
    const fullview = useStore(state => state.fullview);

    const cameraRef = useRef(null);
    const features = useRef(null);
    const recordingRef = useRef(false);

    if (!camPermission)
        return (
            <View
                style={[styles.camera, { height: fullview ? "100%" : "85%" }]}
            />
        );

    const toggleCameraFacing = () =>
        setFacing(current => (current === "back" ? "front" : "back"));

    const reqPermissions = () => {
        requestCamPermission();
        requestMicPermission();
    };

    const fetch = async () => {
        features.current = await cameraRef?.current?.getSupportedFeatures();
    };

    const startRecord = async () => {
        while (recordingRef.current) {
            const { uri } = await cameraRef.current.recordAsync({
                maxDuration: limitDuration * 60,
                maxBytes: limitBytes
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
            startRecord();
        }
    };

    const togglePause = () => {
        cameraRef.current.toggleRecordingAsync();
        setPaused(p => !p);
    };

    return (
        <View style={styles.camContainer}>
            {!camPermission.granted ? (
                <View style={styles.camera}>
                    <TouchableOpacity onPress={reqPermissions}>
                        <Text style={styles.camReqPText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            ) : isFocused ? (

                    // ref={cameraRef}
                    // style={[
                    //     styles.camera,
                    //     { height: fullview ? "100%" : "85%" }
                    // ]}
                    // facing={facing}
                    // mode="video"
                    // mute={isMuted}
                    // videoQuality={videoQuality}
                    // onCameraReady={fetch}

                <CameraView style={[
                        styles.camera,
                        { height: fullview ? "100%" : "85%" }
                    ]}
                    previewEnabled={true} />
                
            ) : (
                <View
                    style={[
                        styles.camera,
                        { height: fullview ? "100%" : "85%" }
                    ]}
                />
            )}

            <Options
                camPermission={camPermission}
                micPermission={micPermission}
                isRecording={isRecording}
            />

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    position: "absolute",
                    bottom: fullview ? "5%" : "18%",
                    width: "100%",
                    paddingHorizontal: 20
                }}
            >
                {/* Left */}
                <View
                    style={{
                        flex: 1,
                        alignItems: "center"
                    }}
                >
                    {features?.current?.toggleRecordingAsyncAvailable &&
                        isRecording && (
                            <Host matchContents>
                                <Icon
                                    onPress={togglePause}
                                    name={paused ? Play : Pause}
                                    size={paused ? 50 : 45}
                                    color="white"
                                />
                            </Host>
                        )}
                </View>

                {/* Center */}
                <View style={{ flex: 1, alignItems: "center" }}>
                    <TouchableOpacity
                        onPress={toggleRecord}
                        style={styles.recordOuter}
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
                </View>

                {/* Right */}
                <View style={{ flex: 1, alignItems: "center" }}>
                    <Host matchContents>
                        <Icon
                            onPress={toggleCameraFacing}
                            name={FlipCam}
                            size={35}
                            color="white"
                        />
                    </Host>
                </View>
            </View>

            <Host
                style={{
                    margin: 10
                }}
                matchContents
            >
                <Icon
                    onPress={() => router.push("/Gallery")}
                    name={PhotoLib}
                    size={40}
                    color="white"
                />
            </Host>
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
        alignItems: "center"
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
