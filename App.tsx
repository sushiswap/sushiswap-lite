/* tslint:disable:ordered-imports */
import "./globals";
import React from "react";

import { OpenSans_300Light, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { UnicaOne_400Regular } from "@expo-google-fonts/unica-one";
import { AppLoading } from "expo";
import { useFonts } from "expo-font";

import { ContextProvider } from "./src/context";
import { Screens } from "./src/screens";
import { YellowBox } from "react-native";

if (__DEV__) {
    YellowBox.ignoreWarnings(["Setting a timer", "VirtualizedLists should never be nested"]);
}

const App = () => {
    const [fontsLoaded] = useFonts({
        title: UnicaOne_400Regular,
        light: OpenSans_300Light,
        regular: OpenSans_400Regular,
        bold: OpenSans_700Bold
    });
    if (!fontsLoaded) {
        return <AppLoading />;
    }
    return (
        <ContextProvider>
            <Screens />
        </ContextProvider>
    );
};

export default App;
