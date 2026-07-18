import { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Host, Icon } from "@expo/ui";
import { router } from "expo-router";
import Settings from "@expo/material-symbols/settings.xml";

import CamView from "../components/CamView.tsx";
import { useStore } from "../utils/store.ts";

export default function App() {
    const fullview = useStore(state => state.fullview);

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
                    <Host
                        matchContents
                    >
                        <Icon
                        onPress={() => router.push("/Settings")}
                        name={Settings} size={30} color={"white"} />
                    </Host>
                </View>
            )}

            <CamView />
        </View>
    );
}

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
