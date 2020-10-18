import React, { useCallback, useContext } from "react";
import { Image, View } from "react-native";

import * as Linking from "expo-linking";

import { Spacing } from "../../constants/dimension";
import { GlobalContext } from "../../context/GlobalContext";
import Button from "../Button";

const ConnectWallet = () => {
    const { darkMode } = useContext(GlobalContext);
    const onPress = useCallback(async () => {
        if (window.ethereum) {
            await window.ethereum.enable();
        } else {
            await Linking.openURL("https://metamask.io/");
        }
    }, [window.ethereum]);
    const title = window.ethereum ? "Connect" : "Install MetaMask";
    return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image
                source={
                    darkMode ? require("../../../assets/metamask-dark.png") : require("../../../assets/metamask.png")
                }
                style={{ width: 223, height: 183, marginBottom: Spacing.huge }}
            />
            <Button type={"outline"} size={"large"} onPress={onPress} title={title} containerStyle={{ width: 440 }} />
        </View>
    );
};
export default ConnectWallet;
