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
