import React, { useContext } from "react";
import { View } from "react-native";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

import { OpenSans_300Light, OpenSans_400Regular, OpenSans_700Bold } from "@expo-google-fonts/open-sans";
import { UnicaOne_400Regular } from "@expo-google-fonts/unica-one";
import { AppLoading } from "expo";
import { useFonts } from "expo-font";

import "dotenv/config";
import useAsyncEffect from "use-async-effect";
import Header from "./src/components/Header";
import { ContextProvider } from "./src/context";
import { GlobalContext } from "./src/context/GlobalContext";
import FarmingScreen from "./src/screens/FarmingScreen";
import LiquidityScreen from "./src/screens/LiquidityScreen";
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
            <Main />
        </ContextProvider>
    );
};

const Main = () => {
    const { load } = useContext(GlobalContext);
    useAsyncEffect(load, []);
    return <Navigation />;
};

const Navigation = () => {
    return (
        <Router>
            <View>
                <Header />
                <Switch>
                    <Route path={"/liquidity"}>
                        <LiquidityScreen />
                    </Route>
                    <Route path={"/farming"}>
                        <FarmingScreen />
                    </Route>
                    <Route path={"/"}>
                        <SwapScreen />
                    </Route>
                </Switch>
            </View>
        </Router>
    );
};

export default App;
