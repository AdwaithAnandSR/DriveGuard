import { useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { Host, Icon } from "@expo/ui";


import CamView from "../components/CamView.tsx";

// const FitScreen = require("../../assets/fit_screen_rounded.xml");

// <Host matchContents>
//     <Icon
//         name={Icon.select({
//             ios: "star.fill",
//             android: import("@expo/material-symbols/star.xml")
//         })}
//         size={32}
//         color="orange"
//     />
// </Host>
export default function App() {
    const [fullview, setFullview] = useState(false);

    const toggleFullView = v => setFullview(v => !v);

    return (
        <View style={styles.container}>
            {!fullview && <Text style={styles.header}>Drive Guard</Text>}

            <CamView fullview={fullview} toggleFullView={toggleFullView} />
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
