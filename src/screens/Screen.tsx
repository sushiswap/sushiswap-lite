import React, { useContext } from "react";
import { View } from "react-native";

import ConnectToWallet from "../components/ConnectToWallet";
import Status from "../components/Status";
import Text from "../components/Text";
import { EthersContext } from "../context/EthersContext";

const Screen = props => {
    const { address, chainId } = useContext(EthersContext);
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
        </View>
    );
};

export default Screen;
