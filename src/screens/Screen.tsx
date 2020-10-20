import React, { useContext } from "react";
import { Platform, View } from "react-native";

import { AppLoading } from "expo";
import { DeviceType } from "expo-device";

import AppHeader from "../components/app/AppHeader";
import Text from "../components/Text";
import ConnectToWallet from "../components/web/ConnectToWallet";
import MobileNotSupported from "../components/web/MobileNotSupported";
import { HEADER_HEIGHT } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";

const Screen = props => {
    const { deviceType } = useContext(GlobalContext);
    const { address, chainId } = useContext(EthersContext);
    if (!deviceType) {
        return <AppLoading />;
    }
    if (Platform.OS === "web") {
        if (deviceType === DeviceType.PHONE) return <MobileNotSupported />;
        if (!address) return <ConnectToWallet />;
        if (chainId !== 1)
            return (
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text light={true} style={{ textAlign: "center" }}>
                        {"Please switch network to\n'Ethereum Mainnet'"}
                    </Text>
                </View>
            );
        return (
            <View
                {...props}
                style={[{ position: "absolute", top: HEADER_HEIGHT, right: 0, bottom: 0, left: 0 }, props.style]}
            />
        );
    } else {
        return (
            <View style={{ width: "100%", height: "100%" }}>
                <AppHeader />
                <View {...props} style={[{ flex: 1 }, props.style]} />
            </View>
        );
    }
};

export default Screen;
