import React, { useCallback, useContext } from "react";
import { Image, View } from "react-native";
import { Link, useRouteMatch } from "react-router-dom";

import Switch from "expo-dark-mode-switch";

import { HEADER_HEIGHT, Spacing } from "../../constants/dimension";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import FlexView from "../FlexView";
import Text from "../Text";

const WebHeader = () => {
    const { background } = useColors();
    return (
        <View
            // @ts-ignore
            style={{
                position: "fixed",
                top: 0,
                zIndex: 100,
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
            <Link to={"/"} style={{ textDecoration: "none" }}>
                <Text style={{ fontFamily: "title", fontSize: 40, color: darkMode ? white : primary }}>SushiSwap</Text>
            </Link>
            <Image
                source={
                    darkMode
                        ? require("../../../assets/levx-typography-dark.png")
                        : require("../../../assets/levx-typography.png")
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
            <MenuItem title={"SWAP"} path={"/"} />
            <MenuItem title={"LIQUIDITY"} path={"/liquidity"} />
            {/*<MenuItem title={"FARMING"} path={"/farming"} />*/}
            <MenuItem title={"STAKING"} path={"/staking"} />
            {/*<MenuItem title={"MIGRATE"} path={"/migrate"} />*/}
            <DarkModeSwitch />
        </FlexView>
    );
};

const MenuItem = ({ title, path }) => {
    const { textDark } = useColors();
    const match = useRouteMatch(path);
    return (
        <Link to={path} style={{ marginLeft: Spacing.small, marginBottom: 4, textDecoration: "none" }}>
            <View>
                <Text style={{ fontFamily: "regular", fontSize: 20, color: textDark, padding: 4 }}>{title}</Text>
                {match?.isExact && (
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

export default WebHeader;
