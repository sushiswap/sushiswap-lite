import React, { useContext } from "react";
import { View } from "react-native";

import { AppLoading } from "expo";
import { DeviceType } from "expo-device";

import ConnectToWallet from "../components/ConnectToWallet";
import Footer from "../components/Footer";
import MobileNotSupported from "../components/MobileNotSupported";
import Status from "../components/Status";
import Text from "../components/Text";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";

const Screen = props => {
    const { deviceType } = useContext(GlobalContext);
    const { address, chainId } = useContext(EthersContext);
    if (!deviceType) {
        return <AppLoading />;
    }
    if (deviceType === DeviceType.PHONE) {
        return <MobileNotSupported />;
    }
    if (!address) {
        return <ConnectToWallet />;
    }
    if (chainId !== 1) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Text light={true} style={{ textAlign: "center" }}>
                    {"Please switch network to\n'Ethereum Mainnet'"}
                </Text>
            </View>
        );
    }
    return (
        <View style={{ flex: 1 }}>
            <View {...props} />
            <Status />
            <Footer />
        </View>
    );
};

export default Screen;
