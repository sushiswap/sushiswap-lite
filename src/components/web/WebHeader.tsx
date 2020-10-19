import React, { useCallback, useContext } from "react";
import { View } from "react-native";
import { Link, useRouteMatch } from "react-router-dom";

import Switch from "expo-dark-mode-switch";

import { HEADER_HEIGHT, HEADER_WIDTH, Spacing } from "../../constants/dimension";
import { EthersContext } from "../../context/EthersContext";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import FlexView from "../FlexView";
import Text from "../Text";

const WebHeader = () => {
    const { header } = useColors();
    return (
        <View
            // @ts-ignore
            style={{
                position: "fixed",
                top: 0,
                zIndex: 100,
                width: "100%",
                height: HEADER_HEIGHT,
                paddingBottom: Spacing.small,
                backgroundColor: header
            }}>
            <FlexView
                style={{
                    flex: 1,
                    width: HEADER_WIDTH,
                    alignSelf: "center",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingTop: Spacing.small,
                    paddingHorizontal: Spacing.normal
                }}>
                <Title />
                <Menu />
            </FlexView>
        </View>
    );
};

export const Title = () => {
    const { darkMode } = useContext(GlobalContext);
    const { textDark, white } = useColors();
    const color = darkMode ? white : textDark;
    return (
        <View style={{ alignSelf: "center", alignItems: "center" }}>
            <Link to={"/"} style={{ textDecoration: "none" }}>
                <Text style={{ fontSize: 28, color }}>SushiSwap</Text>
            </Link>
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
            <MenuItem title={"Swap"} path={"/"} />
            <MenuItem title={"Liquidity"} path={"/liquidity"} />
            {/*<MenuItem title={"Farming"} path={"/farming"} />*/}
            {/*<MenuItem title={"Stake/Unstake"} path={"/staking"} />*/}
            <MenuItem title={"Migrate"} path={"/migrate"} />
            <Status />
            <DarkModeSwitch />
        </FlexView>
    );
};

const MenuItem = ({ title, path }) => {
    const { textDark, textLight } = useColors();
    const match = useRouteMatch(path);
    const active = match?.isExact;
    return (
        <Link to={path} style={{ marginLeft: Spacing.tiny, textDecoration: "none" }}>
            <View>
                <Text style={{ fontFamily: "regular", fontSize: 18, color: active ? textDark : textLight, padding: 4 }}>
                    {title}
                </Text>
            </View>
        </Link>
    );
};

const Status = () => {
    const { textLight, green, borderDark } = useColors();
    const { chainId, address, ensName } = useContext(EthersContext);
    const connected = chainId === 1 && address;
    const title = connected
        ? ensName || address!.substring(0, 6) + "..." + address!.substring(address!.length - 4, address!.length)
        : "Not connected";
    const color = connected ? green : textLight;
    return (
        <FlexView
            style={{
                height: 28,
                justifyContent: "center",
                alignItems: "center",
                marginLeft: Spacing.small,
                paddingHorizontal: Spacing.small,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: borderDark
            }}>
            <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginRight: 12 }} />
            <Text style={{ fontSize: 16, color: textLight, marginRight: 2 }}>{title}</Text>
        </FlexView>
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
        <View style={{ marginLeft: Spacing.tiny, marginRight: -8, marginBottom: -3 }}>
            <Switch
                value={darkMode}
                onChange={onChange}
                style={{
                    transform: [
                        {
                            scale: 0.75
                        }
                    ]
                }}
            />
        </View>
    );
};

export default WebHeader;
