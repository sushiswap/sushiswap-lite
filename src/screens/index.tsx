import React, { useContext } from "react";
import { Platform, View } from "react-native";
import { Icon } from "react-native-elements";
import { HashRouter as Router, Route, Switch } from "react-router-dom";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer, Theme } from "@react-navigation/native";
import useAsyncEffect from "use-async-effect";
import WebHeader from "../components/web/WebHeader";
import WebStatus from "../components/web/WebStatus";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import FarmingScreen from "./FarmingScreen";
import LiquidityScreen from "./LiquidityScreen";
import MigrateScreen from "./MigrateScreen";
import MyLimitOrdersScreen from "./MyLimitOrdersScreen";
import RemoveLiquidityScreen from "./RemoveLiquidityScreen";
import StakingScreen from "./StakingScreen";
import SwapScreen from "./SwapScreen";

export const Screens = () => {
    const { load } = useContext(GlobalContext);
    useAsyncEffect(load, []);
    return Platform.OS === "web" ? <WebScreens /> : <AppScreens />;
};

// tslint:disable-next-line:max-func-body-length
const WebScreens = () => {
    return (
        <Router>
            <View style={{ flex: 1 }}>
                <Switch>
                    <Route path={"/limit-orders"}>
                        <MyLimitOrdersScreen />
                    </Route>
                    <Route path={"/liquidity/remove"}>
                        <RemoveLiquidityScreen />
                    </Route>
                    <Route path={"/liquidity"}>
                        <LiquidityScreen />
                    </Route>
                    <Route path={"/farming"}>
                        <FarmingScreen />
                    </Route>
                    <Route path={"/staking"}>
                        <StakingScreen />
                    </Route>
                    <Route path={"/migrate"}>
                        <MigrateScreen />
                    </Route>
                    <Route path={"/"}>
                        <SwapScreen />
                    </Route>
                </Switch>
                <WebHeader />
                <WebStatus />
            </View>
        </Router>
    );
};

const Tab = createBottomTabNavigator();

const AppScreens = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, secondary, background, border, textDark, disabled } = useColors();
    const theme: Theme = {
        ...DefaultTheme,
        dark: darkMode,
        colors: {
            primary,
            background,
            border,
            card: background,
            notification: background,
            text: textDark
        }
    };
    return (
        <NavigationContainer theme={theme}>
            <Tab.Navigator
                tabBarOptions={{
                    activeTintColor: darkMode ? secondary : primary,
                    inactiveTintColor: disabled,
                    labelStyle: { marginBottom: 4 }
                }}>
                <Tab.Screen name="Home" component={SwapScreen} options={tabOptions("home")} />
                <Tab.Screen name="Liquidity" component={LiquidityScreen} options={tabOptions("water")} />
                <Tab.Screen name="Farming" component={FarmingScreen} options={tabOptions("leaf")} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const tabOptions = iconName => ({
    tabBarIcon: ({ color }) => <Icon type={"material-community"} name={iconName} color={color} />
});
