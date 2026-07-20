import { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Host, Icon } from "@expo/ui";
import { useEventListener } from "expo";

import Battery from "@expo/material-symbols/battery_android_0.xml";
import Heat from "@expo/material-symbols/heat.xml";

import { useStore } from "../utils/store.ts";
import { DriveCam } from "../utils/camera.ts";

export default function TopRow() {
    const [battery, setBattery] = useState(0);
    const [heat, setHeat] = useState(0);

    useEventListener(DriveCam, "onRecordingEvent", event => {
        const { type, data } = event;

        if (type === "SYSTEM_STATS") {
            setHeat(data.batteryTemperature);
            setBattery(data.batteryLevel);
        }
    });

    return (
        <View style={styles.topRowOuter}>
            <Text style={styles.text}>{heat}°c</Text>
            <Text style={styles.text}>{battery + "%"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    topRowOuter: {
        flex: 1,
        paddingHorizontal: "3%",
        gap: 5,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItem: "center"
    },

    text: {
        color: "#e1e1e1",
        fontSize: 11
    }
});
