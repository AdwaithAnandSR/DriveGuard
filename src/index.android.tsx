import React, { useEffect, useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    PermissionsAndroid,
    Platform
} from "react-native";
import DriveCamView from "../../modules/drive-cam/src/DriveCamView.tsx";
import {
    startPreview,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    mute,
    flipCamera,
    getSavedVideoFiles,
    deleteVideoFile,
    shutdownCamera,
    addRecordingEventListener
} from "../../modules/drive-cam/src/DriveCamModule.ts";
import { CameraConfig, SavedVideoFile } from "../../modules/drive-cam/src//DriveCam.types";

export default function App() {
    const [hasPermissions, setHasPermissions] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [files, setFiles] = useState<SavedVideoFile[]>([]);

    // State toggles for UI tracking
    const [isMuted, setIsMuted] = useState(false);
    const [previewEnabled, setPreviewEnabled] = useState(true);

    const scrollViewRef = useRef<ScrollView>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [
            ...prev,
            `[${new Date().toISOString().split("T")[1].slice(0, -1)}] ${msg}`
        ]);
    };

    useEffect(() => {
        requestPermissions();

        // Attach Event Listener
        const subscription = addRecordingEventListener(event => {
            // Ignore system stats to prevent log flooding
            if (event.type === "SYSTEM_STATS") return;

            addLog(`EVENT: ${event.type} | ${JSON.stringify(event.data)}`);
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    // Android 13+ requires notification permissions for Foreground Services
                    ...(Platform.Version >= 33
                        ? [PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS]
                        : [])
                ]);

                const allGranted = Object.values(granted).every(
                    status => status === PermissionsAndroid.RESULTS.GRANTED
                );

                setHasPermissions(allGranted);
                if (allGranted) addLog("Permissions granted");
                else addLog("Permissions DENIED");
            } catch (err: any) {
                addLog(`Permission Error: ${err.message}`);
            }
        }
    };

    // --- Actions ---

    const handleStartPreview = () => {
        const success = startPreview();
        addLog(`startPreview: ${success}`);
    };

    const handleStartRecording = () => {
        const config: CameraConfig = {
            maxDurationMs: 10000, // 10 seconds for testing
            maxSizeMB: 50,
            maxStorageUsageMB: 500,
            autoDelete: true,
            autoOptimize: false,
            lensFacing: "back",
            quality: "720p"
        };
        const success = startRecording(config);
        addLog(`startRecording: ${success}`);
    };

    const handleStopRecording = () => {
        const success = stopRecording();
        addLog(`stopRecording: ${success}`);
    };

    const handlePause = () => addLog(`pauseRecording: ${pauseRecording()}`);
    const handleResume = () => addLog(`resumeRecording: ${resumeRecording()}`);

    const handleToggleMute = () => {
        const newState = !isMuted;
        const success = mute(newState);
        if (success) setIsMuted(newState);
        addLog(`mute(${newState}): ${success}`);
    };

    const handleFlip = () => addLog(`flipCamera: ${flipCamera()}`);

    const handleGetFiles = () => {
        // Note: If you changed this to an AsyncFunction in Kotlin, you must await this.
        // Based on your current sync implementation:
        try {
            const saved = getSavedVideoFiles();
            setFiles(saved);
            addLog(`getSavedVideoFiles: Found ${saved.length} files`);
        } catch (e: any) {
            addLog(`getFiles Error: ${e.message}`);
        }
    };

    const handleDeleteFirstFile = () => {
        if (files.length === 0) {
            addLog("No files to delete");
            return;
        }
        const target = files[0].path;
        const success = deleteVideoFile(target);
        addLog(`deleteVideoFile: ${success}`);
        if (success) handleGetFiles(); // Refresh list
    };

    const handleShutdown = () => addLog(`shutdownCamera: ${shutdownCamera()}`);

    if (!hasPermissions) {
        return (
            <View style={styles.center}>
                <Text>Awaiting Permissions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.cameraContainer}>
                <DriveCamView
                    style={styles.camera}
                    previewEnabled={previewEnabled}
                />
            </View>

            <View style={styles.controls}>
                <ScrollView contentContainerStyle={styles.grid}>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleStartPreview}
                    >
                        <Text style={styles.btnText}>Start Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => setPreviewEnabled(!previewEnabled)}
                    >
                        <Text style={styles.btnText}>
                            Toggle View: {previewEnabled ? "ON" : "OFF"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnRecord]}
                        onPress={handleStartRecording}
                    >
                        <Text style={styles.btnText}>Start Record</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnStop]}
                        onPress={handleStopRecording}
                    >
                        <Text style={styles.btnText}>Stop Record</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btn} onPress={handlePause}>
                        <Text style={styles.btnText}>Pause</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btn} onPress={handleResume}>
                        <Text style={styles.btnText}>Resume</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleToggleMute}
                    >
                        <Text style={styles.btnText}>
                            Mute: {isMuted ? "ON" : "OFF"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.btn} onPress={handleFlip}>
                        <Text style={styles.btnText}>Flip Lens</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btn}
                        onPress={handleGetFiles}
                    >
                        <Text style={styles.btnText}>List Files</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnDelete]}
                        onPress={handleDeleteFirstFile}
                    >
                        <Text style={styles.btnText}>Delete 1st File</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.btn, styles.btnStop]}
                        onPress={handleShutdown}
                    >
                        <Text style={styles.btnText}>Shutdown Service</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.logContainer}
                ref={scrollViewRef}
                onContentSizeChange={() =>
                    scrollViewRef.current?.scrollToEnd({ animated: true })
                }
            >
                {logs.map((log, index) => (
                    <Text key={index} style={styles.logText}>
                        {log}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    cameraContainer: { flex: 1, backgroundColor: "#111" },
    camera: { flex: 1 },
    controls: { height: 250, backgroundColor: "#222", padding: 10 },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between"
    },
    btn: {
        width: "48%",
        backgroundColor: "#444",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: "center"
    },
    btnRecord: { backgroundColor: "#d9534f" },
    btnStop: { backgroundColor: "#f0ad4e" },
    btnDelete: { backgroundColor: "#d9534f" },
    btnText: { color: "#fff", fontWeight: "bold" },
    logContainer: {
        height: 150,
        backgroundColor: "#000",
        padding: 10,
        borderTopWidth: 1,
        borderColor: "#333"
    },
    logText: {
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: 10,
        marginBottom: 4
    }
});
