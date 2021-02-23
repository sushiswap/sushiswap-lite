import React, { useContext } from "react";
import { Icon } from "react-native-elements";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DefaultTheme, NavigationContainer, Theme } from "@react-navigation/native";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import useTranslation from "../../hooks/useTranslation";
import FarmingScreen from "../FarmingScreen";
import HomeScreen from "../HomeScreen";
import LiquidityScreen from "../LiquidityScreen";
import SwapScreen from "../SwapScreen";

const Tab = createBottomTabNavigator();

const AppScreens = () => {
    const t = useTranslation();
    const { darkMode } = useContext(GlobalContext);
    const { primary, accent, background, border, textDark, disabled } = useColors();
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
                    activeTintColor: accent,
                    inactiveTintColor: disabled,
                    labelStyle: { marginBottom: 4 }
                }}>
                <Tab.Screen name={t("menu.home")} component={HomeScreen} options={tabOptions("home")} />
                <Tab.Screen name={t("menu.swap")} component={SwapScreen} options={tabOptions("swap-horizontal")} />
                <Tab.Screen name={t("menu.liquidity")} component={LiquidityScreen} options={tabOptions("water")} />
                <Tab.Screen name={t("menu.farm")} component={FarmingScreen} options={tabOptions("leaf")} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

const tabOptions = iconName => ({
    tabBarIcon: ({ color }) => <Icon type={"material-community"} name={iconName} color={color} />
});

export default AppScreens;
