// import React, { useState, useEffect, useRef } from "react";
// import {
//     View,
//     Text,
//     Button,
//     ScrollView,
//     StyleSheet,
//     SafeAreaView,
//     FlatList,
//     Alert
// } from "react-native";
// import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";

// // Adjust these imports to your actual file paths
// import DriveCamView from "../../modules/drive-cam/src/DriveCamView.tsx";
// import {
//     startPreview,
//     shutdownCamera,
//     startRecording,
//     stopRecording,
//     pauseRecording,
//     resumeRecording,
//     mute,
//     flipCamera,
//     getSavedVideoFiles,
//     deleteVideoFile,
//     addRecordingEventListener
// } from "../../modules/drive-cam/src/DriveCamModule.ts";
// import { SavedVideoFile } from "../../modules/drive-cam/src/DriveCam.types.ts";

// export default function App() {
//     const [cameraPermission, requestCameraPermission] = useCameraPermissions();
//     const [micPermission, requestMicPermission] = useMicrophonePermissions();

//     // UI & Module State
//     const [showPreview, setShowPreview] = useState(true);
//     const [isMuted, setIsMuted] = useState(false);
//     const [files, setFiles] = useState<SavedVideoFile[]>([]);
//     const [logs, setLogs] = useState<string[]>([]);
//     const scrollViewRef = useRef<ScrollView>(null);

//     // Logging Helper - Adds timestamp to every action
//     const addLog = (message: string) => {
//         const time = new Date().toISOString().split("T")[1].slice(0, -1); // Gets HH:MM:SS.mmm
//         setLogs(prev => [...prev, `[${time}] ${message}`]);
//     };

//     // 1. Lifecycle & Event Listeners
//     useEffect(() => {
//         addLog("App Mounted. Checking permissions...");

//         if (!cameraPermission?.granted) requestCameraPermission();
//         if (!micPermission?.granted) requestMicPermission();

//         // Attach native event listener
//         const subscription = addRecordingEventListener(event => {
//             addLog(
//                 `⚡ EVENT: ${event.type} | Data: ${JSON.stringify(event.data)}`
//             );
//         });
//         addLog("Event listener attached.");

//         return () => {
//             addLog("App Unmounting. Cleaning up...");
//             subscription.remove();
//             shutdownCamera();
//         };
//     }, [cameraPermission?.granted, micPermission?.granted]);

//     // 2. Action Handlers
//     const handleStartPreview = () => {
//         addLog("▶️ Action: startPreview()");
//         const res = startPreview();
//         addLog(`Result: ${res}`);
//     };

//     const handleShutdown = () => {
//         addLog("⏹️ Action: shutdownCamera()");
//         const res = shutdownCamera();
//         addLog(`Result: ${res}`);
//     };

//     const handleStartRecording = () => {
//         addLog("⏺️ Action: startRecording(1080p, back)");
//         const res = startRecording({
//             maxDurationMs: 60000,
//             maxSizeMB: 100,
//             maxStorageUsageMB: 1000,
//             autoDelete: true,
//             autoOptimize: true,
//             lensFacing: "back",
//             quality: "1080p"
//         });
//         addLog(`Result: ${res}`);
//     };

//     const handleStopRecording = () => {
//         addLog("⏹️ Action: stopRecording()");
//         const res = stopRecording();
//         addLog(`Result: ${res}`);
//     };

//     const handleFlip = () => {
//         addLog("🔄 Action: flipCamera()");
//         const res = flipCamera();
//         addLog(`Result: ${res}`);
//     };

//     const handleToggleMute = () => {
//         const newMute = !isMuted;
//         addLog(`🔇 Action: mute(${newMute})`);
//         const res = mute(newMute);
//         setIsMuted(newMute);
//         addLog(`Result: ${res}`);
//     };

//     const handleFetchFiles = () => {
//         addLog("📁 Action: getSavedVideoFiles()");
//         const fetched = getSavedVideoFiles();
//         setFiles(fetched);
//         addLog(`Result: Found ${fetched.length} files.`);
//     };

//     const handleDelete = (path: string) => {
//         addLog(`🗑️ Action: deleteVideoFile(${path.split("/").pop()})`);
//         const res = deleteVideoFile(path);
//         addLog(`Result: ${res}`);
//         if (res) handleFetchFiles(); // refresh list
//     };

//     return (
//         <SafeAreaView style={styles.container}>
//             {/* --- TOP: CAMERA PREVIEW --- */}
//             <View style={styles.cameraContainer}>
//                 {cameraPermission?.granted ? (
//                     <DriveCamView
//                         style={styles.camera}
//                         previewEnabled={showPreview}
//                     />
//                 ) : (
//                     <Text style={{ color: "white", textAlign: "center" }}>
//                         No Camera Permission
//                     </Text>
//                 )}
//                 {!showPreview && (
//                     <View style={styles.overlay}>
//                         <Text style={{ color: "white" }}>
//                             Preview Disabled (Background Mode)
//                         </Text>
//                     </View>
//                 )}
//             </View>

//             {/* --- MIDDLE: DEBUG CONSOLE --- */}
//             <View style={styles.consoleContainer}>
//                 <Text style={styles.consoleTitle}>Debug Logs:</Text>
//                 <ScrollView
//                     style={styles.console}
//                     ref={scrollViewRef}
//                     onContentSizeChange={() =>
//                         scrollViewRef.current?.scrollToEnd({ animated: true })
//                     }
//                 >
//                     {logs.map((log, i) => (
//                         <Text key={i} style={styles.logText}>
//                             {log}
//                         </Text>
//                     ))}
//                 </ScrollView>
//                 <Button
//                     title="Clear Logs"
//                     onPress={() => setLogs([])}
//                     color="#444"
//                 />
//             </View>

//             {/* --- BOTTOM: CONTROLS --- */}
//             <View style={styles.controlsContainer}>
//                 <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//                     <View style={styles.btnGroup}>
//                         <Button
//                             title="Start Preview"
//                             onPress={handleStartPreview}
//                             color="#4CAF50"
//                         />
//                         <Button
//                             title="Shutdown"
//                             onPress={handleShutdown}
//                             color="#F44336"
//                         />
//                         <Button
//                             title="Toggle Preview UI"
//                             onPress={() => setShowPreview(!showPreview)}
//                         />

//                         <Button
//                             title="Start REC"
//                             onPress={handleStartRecording}
//                             color="#f00"
//                         />
//                         <Button
//                             title="Stop REC"
//                             onPress={handleStopRecording}
//                             color="#555"
//                         />

//                         <Button title="Flip Cam" onPress={handleFlip} />
//                         <Button
//                             title={isMuted ? "Unmute" : "Mute"}
//                             onPress={handleToggleMute}
//                         />

//                         <Button
//                             title="Pause"
//                             onPress={() => {
//                                 addLog("⏸️ Action: pauseRecording()");
//                                 pauseRecording();
//                             }}
//                         />
//                         <Button
//                             title="Resume"
//                             onPress={() => {
//                                 addLog("▶️ Action: resumeRecording()");
//                                 resumeRecording();
//                             }}
//                         />
//                     </View>
//                 </ScrollView>
//             </View>

//             {/* --- BOTTOM: FILE SYSTEM --- */}
//             <View style={styles.filesContainer}>
//                 <Button title="Fetch Files" onPress={handleFetchFiles} />
//                 <FlatList
//                     data={files}
//                     keyExtractor={item => item.path}
//                     renderItem={({ item }) => (
//                         <View style={styles.fileRow}>
//                             <Text style={styles.fileText} numberOfLines={1}>
//                                 {item.name} (
//                                 {(item.size / 1024 / 1024).toFixed(2)} MB)
//                             </Text>
//                             <Button
//                                 title="Del"
//                                 onPress={() => handleDelete(item.path)}
//                                 color="red"
//                             />
//                         </View>
//                     )}
//                 />
//             </View>
//         </SafeAreaView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: "#121212" },
//     cameraContainer: {
//         height: 250,
//         backgroundColor: "#000",
//         position: "relative"
//     },
//     camera: { flex: 1 },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         backgroundColor: "rgba(0,0,0,0.7)",
//         justifyContent: "center",
//         alignItems: "center"
//     },

//     consoleContainer: {
//         flex: 1,
//         backgroundColor: "#1e1e1e",
//         margin: 5,
//         padding: 5,
//         borderRadius: 5
//     },
//     consoleTitle: { color: "#888", fontSize: 12, marginBottom: 5 },
//     console: { flex: 1 },
//     logText: {
//         color: "#0f0",
//         fontFamily: "monospace",
//         fontSize: 11,
//         marginBottom: 2
//     },

//     controlsContainer: { padding: 5, backgroundColor: "#222" },
//     btnGroup: { flexDirection: "row", gap: 10, paddingHorizontal: 5 },

//     filesContainer: { height: 150, backgroundColor: "#333", padding: 5 },
//     fileRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         borderBottomWidth: 1,
//         borderBottomColor: "#555",
//         paddingVertical: 5
//     },
//     fileText: { color: "white", fontSize: 12, flex: 1, marginRight: 10 }
// });
