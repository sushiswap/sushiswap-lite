import React, { useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";

import Switch from "expo-dark-mode-switch";

import { Link, useRoute } from "@react-navigation/native";
import { HEADER_HEIGHT, Spacing } from "../constants/dimension";
import linking from "../constants/linking";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import FlexView from "./FlexView";
import Text from "./Text";

const Header = () => {
    const { background } = useColors();
    return (
        <View
            // @ts-ignore
            style={{
                position: "fixed",
                top: 0,
                width: "100%",
                height: HEADER_HEIGHT,
                paddingBottom: 16,
                backgroundColor: background
            }}>
            <FlexView
                style={{
                    flex: 1,
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingTop: Spacing.small,
                    paddingHorizontal: Spacing.content
                }}>
                <Title />
                <Menu />
            </FlexView>
        </View>
    );
};

export const Title = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary, white } = useColors();
    return (
        <FlexView style={{ alignItems: "flex-end" }}>
            <Link to={"/"}>
                <Text style={{ fontFamily: "title", fontSize: 40, color: darkMode ? white : primary }}>SushiSwap</Text>
            </Link>
            <Text
                style={{
                    fontFamily: "light",
                    fontSize: 16,
                    color: darkMode ? white : primary,
                    paddingLeft: 4,
                    paddingBottom: 4
                }}>
                .levx.app
            </Text>
        </FlexView>
    );
};

const Menu = () => {
    return (
        <FlexView
            style={{
                height: "100%",
                alignItems: "flex-end"
            }}>
            <MenuItem title={"SWAP"} routeName={"Home"} />
            <MenuItem title={"POOLS"} routeName={"Pools"} />
            <MenuItem title={"YIELD"} routeName={"Yield"} />
            <DarkModeSwitch />
        </FlexView>
    );
};

const MenuItem = ({ title, routeName }) => {
    const { textDark } = useColors();
    const [current, setCurrent] = useState(false);
    const route = useRoute();
    useEffect(() => {
        setCurrent(route.name === routeName);
    }, [route]);
    return (
        <Link to={"/" + linking.config.screens[routeName]} style={{ marginLeft: Spacing.normal, marginBottom: 4 }}>
            <View>
                <Text style={{ fontFamily: "regular", fontSize: 20, color: textDark }}>{title}</Text>
                {current && (
                    <View
                        style={{
                            position: "absolute",
                            height: 2,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: textDark
                        }}
                    />
                )}
            </View>
        </Link>
    );
};

const DarkModeSwitch = () => {
    const { darkMode, setDarkMode } = useContext(GlobalContext);
    const onChange = useCallback(
        async dark => {
            await setDarkMode(dark);
        },
        [setDarkMode]
    );
    return (
        <View style={{ marginLeft: Spacing.normal, marginBottom: 0 }}>
            <Switch
                value={darkMode}
                onChange={onChange}
                style={{
                    transform: [
                        {
                            scale: 0.7
                        }
                    ]
                }}
            />
        </View>
    );
};

export default Header;
