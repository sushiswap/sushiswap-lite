import React, { useContext, useEffect } from "react";
import { Platform, View } from "react-native";
import { useLocation } from "react-router-dom";

import AppHeader from "../components/app/AppHeader";
import Text from "../components/Text";
import ConnectToWallet from "../components/web/ConnectToWallet";
import { HEADER_HEIGHT } from "../constants/dimension";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";

const Screen = props => {
    const { setLocale } = useContext(GlobalContext);
    const query = useQuery();
    useEffect(() => {
        const locale = query.get("locale");
        if (locale) {
            setLocale(locale);
        }
    }, [query]);
    return Platform.select({
        web: <WebScreen {...props} />,
        default: <AppScreen {...props} />
    });
};

const WebScreen = props => {
    const { address, chainId } = useContext(EthersContext);
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
};

const AppScreen = props => (
    <View style={{ width: "100%", height: "100%" }}>
        <AppHeader />
        <View {...props} style={[{ flex: 1 }, props.style]} />
    </View>
);

const useQuery = () => {
    const location = useLocation();
    return new URLSearchParams(location.search);
};

export default Screen;
