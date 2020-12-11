import React, { useContext } from "react";
import { TouchableWithoutFeedback, View } from "react-native";
import { Icon } from "react-native-elements";
import { Link, useRouteMatch } from "react-router-dom";

import Modal from "modal-react-native-web";
import { Spacing } from "../../constants/dimension";
import { EthersContext } from "../../context/EthersContext";
import useColors from "../../hooks/useColors";
import useTranslation from "../../hooks/useTranslation";
import DarkModeSwitch from "../DarkModeSwitch";
import FlexView from "../FlexView";
import Text from "../Text";

// tslint:disable-next-line:max-func-body-length
const MobileWebMenu = ({ expanded, onCollapse }) => {
    const t = useTranslation();
    const { overlay } = useColors();
    return (
        <Modal animationType="slide" transparent={true} visible={expanded}>
            <TouchableWithoutFeedback style={{ height: "100%" }} onPress={onCollapse}>
                <View
                    style={{
                        height: "100%",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        paddingRight: Spacing.normal,
                        paddingBottom: Spacing.normal,
                        backgroundColor: overlay
                    }}>
                    <View style={{ marginTop: Spacing.small }}>
                        <CloseButton onPress={onCollapse} />
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <DarkModeSwitch style={{ marginBottom: 4 }} />
                        <Status />
                        <View style={{ height: Spacing.large }} />
                        <MobileWebMenuItem title={t("menu.home")} path={"/"} />
                        <MobileWebMenuItem title={t("menu.swap")} path={"/swap"} />
                        <MobileWebMenuItem title={t("menu.liquidity")} path={"/liquidity"} />
                        <MobileWebMenuItem title={t("menu.migrate")} path={"/migrate"} />
                        <MobileWebMenuItem title={t("menu.stake")} path={"/staking"} />
                        <MobileWebMenuItem title={t("menu.farm")} path={"/farming"} />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const CloseButton = ({ onPress }) => {
    const { textDark } = useColors();
    return <Icon type={"material-community"} name={"close"} color={textDark} size={32} onPress={onPress} />;
};

const MobileWebMenuItem = ({ title, path }) => {
    const { textDark, textLight } = useColors();
    const match = useRouteMatch(path);
    const active = match?.path?.startsWith(path);
    return (
        <Link to={path} style={{ textDecoration: "none", marginBottom: Spacing.tiny }}>
            <Text
                style={{
                    fontFamily: "regular",
                    fontSize: 24,
                    color: active ? textDark : textLight
                }}>
                {title}
            </Text>
        </Link>
    );
};

const Status = () => {
    const t = useTranslation();
    const { textLight, green, accent } = useColors();
    const { ethereum, chainId, address, ensName } = useContext(EthersContext);
    const connected = chainId === 1 && address;
    const title = connected
        ? ensName || address!.substring(0, 6) + "..." + address!.substring(address!.length - 4, address!.length)
        : t("menu.not-connected");
    const color = connected ? green : textLight;
    const onPress = () => {
        ethereum?.disconnect?.();
    };
    return (
        <View>
            <FlexView style={{ marginBottom: Spacing.tiny }}>
                <View style={{ backgroundColor: color, width: 6, height: 6, borderRadius: 3, marginTop: 8 }} />
                <Text style={{ fontSize: 18, color: textLight, marginLeft: 8 }}>{title}</Text>
            </FlexView>
            {ethereum?.isWalletConnect && (
                <Text
                    style={{ fontFamily: "regular", fontSize: 15, color: accent, alignSelf: "flex-end" }}
                    onPress={onPress}>
                    Disconnect
                </Text>
            )}
        </View>
    );
};

export default MobileWebMenu;
