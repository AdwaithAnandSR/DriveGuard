import { useState, useEffect } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Host, Icon } from "@expo/ui";
import { router } from "expo-router";
import Settings from "@expo/material-symbols/settings.xml";

import CamView from "../components/CamView.tsx";
import { useStore } from "../utils/store.ts";
import { CamUtils, CameraView } from "../utils/camera.ts";

export default function App() {
    const fullview = useStore(state => state.fullview);

    useEffect(() => {
        (async () => {
            await console.log(CamUtils.startRecording());
        })();
    }, []);

    return (
        <View style={styles.container}>
            {!fullview && (
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingRight: 25
                    }}
                >
                    <Text style={styles.header}>Drive Guard</Text>
                    <Host matchContents>
                        <Icon
                            onPress={() => router.push("/Settings")}
                            name={Settings}
                            size={30}
                            color={"white"}
                        />
                    </Host>
                </View>
            )}
            <CameraView
                style={[
                    styles.camera,
                    {
                        height: fullview ? "100%" : "85%",
                        borderColor: "green",
                        borderWidth: 2
                    }
                ]}
                previewEnabled={true}
            />
        </View>
    );
}
// <CamView />

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "black"
    },
    header: {
        fontSize: 42,
        fontWeight: "bold",
        paddingHorizontal: "2%",
        paddingVertical: "8%",
        color: "white"
    }
});






// import { useState, useEffect } from "react";
// import { Button, StyleSheet, Text, View, Alert } from "react-native";
// import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera'; // <-- Add this
// import { useStore } from "../utils/store.ts";
// import { CamUtils, CameraView } from "../utils/camera.ts";

// export default function App() {
//     const fullview = useStore(state => state.fullview);
    
//     // 1. Setup permission hooks
//     const [cameraPermission, requestCameraPermission] = useCameraPermissions();
//     const [micPermission, requestMicPermission] = useMicrophonePermissions();
    
//     const [isRecording, setIsRecording] = useState(false);

//     // 2. Safely start recording ONLY after permissions are granted
//     const handleStartRecording = async () => {
//         if (!cameraPermission?.granted) {
//             const camReq = await requestCameraPermission();
//             if (!camReq.granted) return Alert.alert("Camera permission required");
//         }
//         if (!micPermission?.granted) {
//             const micReq = await requestMicPermission();
//             if (!micReq.granted) return Alert.alert("Microphone permission required");
//         }

//         // Now that we are 100% sure we have permissions, start the native service
//         CamUtils.startRecording({
//             maxDurationMs: 60000,
//             maxSizeMB: 100,
//             autoDelete: true,
//             autoOptimize: false,
//             lensFacing: 'back'
//         });
        
//         setIsRecording(true);
//     };

//     // 3. Do not render the camera view until permissions are loaded
//     if (!cameraPermission || !micPermission) {
//         return <View style={styles.container}><Text style={{color: 'white'}}>Loading...</Text></View>;
//     }

//     return (
//         <View style={styles.container}>
//             <Button 
//                 title={isRecording ? "Recording Started" : "Start Recording"} 
//                 onPress={handleStartRecording} 
//                 disabled={isRecording}
//             />
                    
//             {/* 4. Only mount the preview when we have permission */}
//             {cameraPermission.granted && (
//                 <CameraView
//                     style={[
//                         styles.camera,
//                         {
//                             height: fullview ? "100%" : "85%",
//                             width: "100%", // <--- CRITICAL FIX: Add explicit width!
//                             borderColor: "green",
//                             borderWidth: 2
//                         }
//                     ]}
//                     // Turn preview on. The native UI will wait for the service to bind it.
//                     previewEnabled={true} 
//                 />
//             )}
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center", // <-- Centers the camera view
//         backgroundColor: "black"
//     },
//     camera: {
//         // flex: 1, // Alternatively, you can use flex: 1 instead of height/width %
//         overflow: 'hidden'
//     }
// });
