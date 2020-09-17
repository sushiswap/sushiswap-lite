import React, { useContext, useState } from "react";
import { useColorScheme } from "react-native-appearance";

import { Trade } from "@levx/sushiswap-sdk";
import AsyncStorage from "@react-native-community/async-storage";
import useAsyncEffect from "use-async-effect";
import { ETH } from "../constants/tokens";
import useSDK from "../hooks/useSDK";
import Token from "../types/Token";
import { EthersContext } from "./EthersContext";

export const GlobalContext = React.createContext({
    load: async () => {},
    clear: async () => {},
    darkMode: false as boolean,
    setDarkMode: async darkMode => {},
    tokens: [ETH] as Token[],
    updateTokens: async () => {},
    loadingTokens: false,
    tradeHistory: {},
    addToTradeHistory: async trade => {}
});

// tslint:disable-next-line:max-func-body-length
export const GlobalContextProvider = ({ children }) => {
    const { provider, signer, address, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const { getTokens } = useSDK();
    const colorScheme = useColorScheme();
    const [darkMode, setDarkMode] = useState(colorScheme === "dark");
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(true);
    const [tradeHistory, setTradeHistory] = useState([] as Trade[]);
    const updateTokens = async () => {
        try {
            const data = await getTokens();
            if (data) {
                await setTokens(data);
            }
        } finally {
            setLoadingTokens(false);
        }
    };
    // useEffect(() => {
    //     updateTokens();
    //     addOnBlockListener("updateTokens()", updateTokens);
    //     return () => {
    //         removeOnBlockListener("updateTokens()");
    //     };
    // }, [updateTokens]);
    useAsyncEffect(async () => {
        if (provider && signer) {
            setLoadingTokens(true);
            await updateTokens();
        }
    }, [provider, signer, address]);
    return (
        <GlobalContext.Provider
            value={{
                load: async () => {
                    const mode = await AsyncStorage.getItem("dark_mode");
                    setDarkMode(mode === "true");
                    setTradeHistory(JSON.parse((await AsyncStorage.getItem("trade_history")) || "[]"));
                },
                clear: async () => {
                    setDarkMode(false);
                    await AsyncStorage.removeItem("dark_mode");
                    await AsyncStorage.removeItem("trade_history");
                },
                darkMode,
                setDarkMode: async (mode: boolean) => {
                    await AsyncStorage.setItem("dark_mode", String(mode));
                    setDarkMode(mode);
                },
                tokens,
                updateTokens,
                loadingTokens,
                tradeHistory,
                addToTradeHistory: async (trade: Trade) => {
                    if (address) {
                        const list = tradeHistory[address] || [];
                        list.push(trade);
                        const newHistory = {
                            ...tradeHistory,
                            [address]: list
                        };
                        await AsyncStorage.setItem("trade_history", JSON.stringify(newHistory));
                        setTradeHistory(newHistory);
                    }
                }
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const GlobalContextConsumer = GlobalContext.Consumer;
