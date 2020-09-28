import React, { useContext } from "react";
import { View } from "react-native";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

import { OpenSans_300Light, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { UnicaOne_400Regular } from "@expo-google-fonts/unica-one";
import { AppLoading } from "expo";
import { DeviceType } from "expo-device";
import { useFonts } from "expo-font";

import "dotenv/config";
import useAsyncEffect from "use-async-effect";
import Header from "./src/components/Header";
import MobileNotSupported from "./src/components/MobileNotSupported";
import { ContextProvider } from "./src/context";
import { GlobalContext } from "./src/context/GlobalContext";
import FarmingScreen from "./src/screens/FarmingScreen";
import LiquidityScreen from "./src/screens/LiquidityScreen";
import SushiBarScreen from "./src/screens/SushiBarScreen";
import SwapScreen from "./src/screens/SwapScreen";

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
            <Router>
                <Main />
            </Router>
        </ContextProvider>
    );
};

const Main = () => {
    const { load, deviceType } = useContext(GlobalContext);
    useAsyncEffect(load, []);
    if (!deviceType) {
        return <AppLoading />;
    }
    if (deviceType === DeviceType.PHONE) {
        return <MobileNotSupported />;
    }
    return <Navigation />;
};

const Navigation = () => {
    return (
        <View style={{ flex: 1 }}>
            <Header />
            <Switch>
                <Route path={"/liquidity"}>
                    <LiquidityScreen />
                </Route>
                <Route path={"/farming"}>
                    <FarmingScreen />
                </Route>
                <Route path={"/sushibar"}>
                    <SushiBarScreen />
                </Route>
                <Route path={"/"}>
                    <SwapScreen />
                </Route>
            </Switch>
        </View>
    );
};

export default App;
