import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useEventListener } from "expo";

import { DriveCam } from "../utils/camera.ts";

export default function TopRow() {
    const [heat, setHeat] = useState(0);

    useEventListener(DriveCam, "onRecordingEvent", event => {
        const { type, data } = event;

        if (type === "SYSTEM_STATS")
            if (data.batteryTemperature !== heat)
                setHeat(data.batteryTemperature);
    });

    return (
        <View style={styles.topRowOuter}>
            <Text style={styles.text}>{heat}°c</Text>
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
