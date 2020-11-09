import React, { useCallback, useContext } from "react";
import { Image, View } from "react-native";

import * as Linking from "expo-linking";

import { IS_DESKTOP, Spacing } from "../../constants/dimension";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import { getEthereum } from "../../utils";
import Button from "../Button";

const ConnectWallet = () => {
    const { primary } = useColors();
    const { darkMode } = useContext(GlobalContext);
    const ethereum = getEthereum();
    const onPress = useCallback(async () => {
        if (ethereum) {
            await ethereum.request({ method: "eth_requestAccounts" });
        } else {
            await Linking.openURL("https://metamask.io/");
        }
    }, [getEthereum]);
    const metaMask = ethereum?.isMetaMask || false;
    const source = metaMask
        ? darkMode
            ? require("../../../assets/metamask-dark.png")
            : require("../../../assets/metamask.png")
        : require("../../../assets/sushiswap.jpg");
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image source={source} style={{ width: metaMask ? 223 : 200, height: metaMask ? 183 : 200 }} />
            <Button
                size={"large"}
                color={metaMask ? "#e2761b" : primary}
                onPress={onPress}
                title={ethereum ? "Connect" : "Install MetaMask"}
                containerStyle={{ width: IS_DESKTOP ? 440 : "100%" }}
                style={{ marginTop: Spacing.large, marginHorizontal: Spacing.normal }}
            />
        </View>
    );
};
export default ConnectWallet;
