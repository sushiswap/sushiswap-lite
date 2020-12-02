import React, { FC, useContext } from "react";
import { TouchableHighlight, View } from "react-native";
import { Icon } from "react-native-elements";
import { Link, useRouteMatch } from "react-router-dom";

import { HEADER_HEIGHT, HEADER_WIDTH, IS_DESKTOP, Spacing } from "../../constants/dimension";
import { EthersContext } from "../../context/EthersContext";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import DarkModeSwitch from "../DarkModeSwitch";
import FlexView from "../FlexView";
import SvgLogo from "../svg/SvgLogo";
import Text from "../Text";

export interface WebHeaderProps {
    onExpandMenu?: () => void;
}

const WebHeader: FC<WebHeaderProps> = props => {
    const { header, borderDark } = useColors();
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
                backgroundColor: header,
                borderBottomWidth: 1,
                borderColor: borderDark
            }}>
            <FlexView
                style={{
                    flex: 1,
                    width: IS_DESKTOP ? HEADER_WIDTH : "100%",
                    alignSelf: "center",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    paddingTop: Spacing.small,
                    paddingHorizontal: Spacing.normal
                }}>
                <Title />
                {IS_DESKTOP ? <Menu /> : <MenuIcon onExpand={props.onExpandMenu} />}
            </FlexView>
        </View>
    );
};

export const Title = () => {
    const { darkMode } = useContext(GlobalContext);
    const { textDark, white } = useColors();
    const color = darkMode ? white : textDark;
    return (
        <FlexView style={{ alignSelf: "center", alignItems: "center" }}>
            <SvgLogo width={32} height={32} style={{ marginRight: 8 }} />
            <Link to={"/"} style={{ textDecoration: "none" }}>
                <Text style={{ fontSize: 28, color }}>SushiSwap</Text>
                <Text fontWeight={"light"} style={{ fontSize: 28, color, marginLeft: 4 }}>
                    lite
                </Text>
            </Link>
        </FlexView>
    );
};

const Menu = () => {
    return (
        <FlexView
            style={{
                height: "100%",
                alignItems: "center"
            }}>
            <MenuItem title={"Swap"} path={"/swap"} />
            <MenuItem title={"Liquidity"} path={"/liquidity"} />
            <MenuItem title={"Migrate"} path={"/migrate"} />
            <MenuItem title={"Stake"} path={"/staking"} />
            {/*<MenuItem title={"Farm"} path={"/farming"} />*/}
            <DarkModeSwitch style={{ marginLeft: Spacing.small }} />
            <Status />
        </FlexView>
    );
};

const MenuItem = ({ title, path }) => {
    const { textDark, textLight } = useColors();
    const match = useRouteMatch(path);
    const active = match?.path?.startsWith(path);
    return (
        <Link to={path} style={{ marginLeft: Spacing.tiny, textDecoration: "none" }}>
            <Text
                style={{
                    fontFamily: "regular",
                    fontSize: 18,
                    color: active ? textDark : textLight,
                    padding: 3
                }}>
                {title}
            </Text>
        </Link>
    );
};

const MenuIcon = ({ onExpand }) => {
    const { textDark } = useColors();
    return <Icon type={"material-community"} name={"menu"} size={28} color={textDark} onPress={onExpand} />;
};

const Status = () => {
    const { textLight, green, borderDark } = useColors();
    const { ethereum, chainId, address, ensName } = useContext(EthersContext);
    const connected = chainId === 1 && address;
    const title = connected
        ? ensName || address!.substring(0, 6) + "..." + address!.substring(address!.length - 4, address!.length)
        : "Not connected";
    const color = connected ? green : textLight;
    const onPress = () => {
        if (confirm("Do you want to disconnect?")) ethereum?.disconnect?.();
    };
    return (
        <TouchableHighlight onPress={onPress} disabled={!ethereum?.isWalletConnect}>
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
                <Text style={{ fontSize: 15, color: textLight, marginRight: 2 }}>{title}</Text>
                {ethereum?.isWalletConnect && <CloseIcon />}
            </FlexView>
        </TouchableHighlight>
    );
};

const CloseIcon = () => {
    const { textLight } = useColors();
    return (
        <Icon
            type={"material-community"}
            name={"close"}
            size={15}
            color={textLight}
            style={{ paddingLeft: 2, paddingTop: 2 }}
        />
    );
};

export default WebHeader;
