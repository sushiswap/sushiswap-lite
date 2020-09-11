import React, { useCallback, useContext, useEffect, useState } from "react";
import { View } from "react-native";

import Switch from "expo-dark-mode-switch";

import { Link, useRoute } from "@react-navigation/native";
import { HEADER_HEIGHT, Spacing } from "../constants/dimension";
import linking from "../constants/linking";
import { EthersContext } from "../context/EthersContext";
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
            <Status />
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
                {" "}
                on LevX
            </Text>
        </FlexView>
    );
};

const Menu = () => {
    return (
        <FlexView
            style={{
                height: "100%",
                alignItems: "flex-end",
                paddingBottom: 8
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

const Status = () => {
    const { borderDark, textMedium, textLight, green } = useColors();
    const { address } = useContext(EthersContext);
    const title = address ? "Connected " : "Not connected";
    const color = address ? green : textLight;
    return (
        <View style={{ position: "absolute", width: "100%", height: "100%" }}>
            <FlexView
                style={{
                    alignSelf: "center",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 40,
                    marginTop: 20,
                    paddingHorizontal: Spacing.normal,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: borderDark
                }}>
                <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: textMedium, marginRight: 2 }}>{title}</Text>
                {/*<Icon type={"material-community"} name={"chevron-down"} color={textLight} size={22} />*/}
            </FlexView>
        </View>
    );
};

export default Header;
