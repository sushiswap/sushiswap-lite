import React, { useCallback, useContext, useEffect, useState } from "react";
import { Image, View } from "react-native";
import { Icon } from "react-native-elements";

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
        <View style={{ alignSelf: "center", alignItems: "center" }}>
            <Link to={"/"}>
                <Text style={{ fontFamily: "title", fontSize: 40, color: darkMode ? white : primary }}>SushiSwap</Text>
            </Link>
            <Image
                source={
                    darkMode
                        ? require("../../assets/levx-typography-dark.png")
                        : require("../../assets/levx-typography.png")
                }
                style={{ width: 76, height: 13 }}
            />
        </View>
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
            <MenuItem title={"LIQUIDITY"} routeName={"Liquidity"} />
            <MenuItem title={"FARMING"} routeName={"Farming"} />
            <Stats />
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
        <Link to={"/" + linking.config.screens[routeName]} style={{ marginLeft: Spacing.small, marginBottom: 4 }}>
            <View>
                <Text style={{ fontFamily: "regular", fontSize: 20, color: textDark, padding: 4 }}>{title}</Text>
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

const Stats = () => {
    const { textDark } = useColors();
    return (
        <Link to={"https://sushiswap.vision"} target={"_blank"} style={{ marginLeft: Spacing.small, marginBottom: 4 }}>
            <FlexView style={{ alignItems: "flex-start" }}>
                <Text style={{ fontFamily: "regular", fontSize: 20, color: textDark, padding: 4 }}>{"STATS"}</Text>
                <Icon
                    name={"arrow-top-right"}
                    type={"material-community"}
                    size={18}
                    color={textDark}
                    style={{ marginTop: 6 }}
                />
            </FlexView>
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
        <View style={{ marginLeft: Spacing.small, marginBottom: 4 }}>
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
