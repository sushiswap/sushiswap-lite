import React, { useContext } from "react";
import { Image, View } from "react-native";

import WalletConnectProvider from "@walletconnect/web3-provider";
import { IS_DESKTOP, Spacing } from "../../constants/dimension";
import { EthersContext } from "../../context/EthersContext";
import { GlobalContext } from "../../context/GlobalContext";
import useColors from "../../hooks/useColors";
import useTranslation from "../../hooks/useTranslation";
import Button from "../Button";

const ConnectWallet = () => {
    const { darkMode } = useContext(GlobalContext);
    const metaMask = window.ethereum?.isMetaMask || false;
    const source = metaMask
        ? darkMode
            ? require("../../../assets/metamask-dark.png")
            : require("../../../assets/metamask.png")
        : require("../../../assets/sushiswap.jpg");
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image
                source={source}
                style={{ width: metaMask ? 223 : 200, height: metaMask ? 183 : 200, marginBottom: Spacing.normal }}
            />
            {window.ethereum && <ConnectButton />}
            <WalletConnectButton />
        </View>
    );
};

const ConnectButton = () => {
    const t = useTranslation();
    const { primary } = useColors();
    const { setEthereum } = useContext(EthersContext);
    const onPress = async () => {
        if (window.ethereum) {
            await window.ethereum.request({ method: "eth_requestAccounts" });
            setEthereum(window.ethereum);
        } else {
            alert(t("no-ethereum-provider-found"));
        }
    };
    const metaMask = window.ethereum?.isMetaMask || false;
    return (
        <Button
            size={"large"}
            color={metaMask ? "#e2761b" : primary}
            onPress={onPress}
            title={metaMask ? "MetaMask" : t("connect")}
            containerStyle={{ width: IS_DESKTOP ? 440 : "100%" }}
            style={{ marginTop: Spacing.small, marginHorizontal: Spacing.normal }}
        />
    );
};

const WalletConnectButton = () => {
    const { darkMode } = useContext(GlobalContext);
    const { primary } = useColors();
    const { setEthereum } = useContext(EthersContext);
    const onPress = async () => {
        const ethereum = new WalletConnectProvider({
            rpc: {
                1: "https://eth-mainnet.alchemyapi.io/v2/fF51JjrwO8qCZW13KRflYpqU_ZeOH1Er"
            }
        });
        await ethereum.enable();
        // @ts-ignore
        setEthereum(ethereum);
    };
    return (
        <Button
            size={"large"}
            type={"outline"}
            color={darkMode ? "white" : primary}
            onPress={onPress}
            title={"WalletConnect"}
            containerStyle={{ width: IS_DESKTOP ? 440 : "100%" }}
            style={{ marginTop: Spacing.small, marginHorizontal: Spacing.normal }}
        />
    );
};

export default ConnectWallet;
