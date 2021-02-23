/* tslint:disable:ordered-imports */
import "node-libs-expo/globals";
import React from "react";

import { OpenSans_300Light, OpenSans_400Regular, OpenSans_600SemiBold } from "@expo-google-fonts/open-sans";
import { AppLoading } from "expo";
import { useFonts } from "expo-font";

import { ContextProvider } from "./src/context";
import Screens from "./src/screens";
import { LogBox } from "react-native";

if (__DEV__) {
    LogBox.ignoreLogs(["Setting a timer", "VirtualizedLists should never be nested"]);
}

const App = () => {
    const [fontsLoaded] = useFonts({
        light: OpenSans_300Light,
        regular: OpenSans_400Regular,
        bold: OpenSans_600SemiBold
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
