import React, { useState } from "react";
import { useColorScheme } from "react-native-appearance";

import AsyncStorage from "@react-native-community/async-storage";
import { Trade } from "@uniswap/sdk";
import { ETH } from "../constants/tokens";
import Token from "../model/Token";

export const GlobalContext = React.createContext({
    load: async () => {},
    clear: async () => {},
    darkMode: false as boolean,
    setDarkMode: async darkMode => {},
    tokens: [ETH] as Token[],
    setTokens: async tokens => {},
    tradeHistory: {},
    addToTradeHistory: async (address, trade) => {}
});

// tslint:disable-next-line:max-func-body-length
export const GlobalContextProvider = ({ children }) => {
    const colorScheme = useColorScheme();
    const [darkMode, setDarkMode] = useState(colorScheme === "dark");
    const [tokens, setTokens] = useState([ETH]);
    const [tradeHistory, setTradeHistory] = useState([] as Trade[]);
    return (
        <GlobalContext.Provider
            value={{
                load: async () => {
                    const mode = await AsyncStorage.getItem("dark_mode");
                    setDarkMode(mode === "true");
                    setTokens(JSON.parse((await AsyncStorage.getItem("tokens")) || "[]"));
                    setTradeHistory(JSON.parse((await AsyncStorage.getItem("trade_history")) || "[]"));
                },
                clear: async () => {
                    setDarkMode(false);
                    await AsyncStorage.removeItem("dark_mode");
                    await AsyncStorage.removeItem("tokens");
                    await AsyncStorage.removeItem("trade_history");
                },
                darkMode,
                setDarkMode: async (mode: boolean) => {
                    await AsyncStorage.setItem("dark_mode", String(mode));
                    setDarkMode(mode);
                },
                tokens,
                setTokens: async (t: Token[]) => {
                    await AsyncStorage.setItem("tokens", JSON.stringify(t));
                    setTokens(t);
                },
                tradeHistory,
                addToTradeHistory: async (address: string, trade: Trade) => {
                    const list = tradeHistory[address] || [];
                    list.push(trade);
                    const newHistory = {
                        ...tradeHistory,
                        [address]: list
                    };
                    await AsyncStorage.setItem("trade_history", JSON.stringify(newHistory));
                    setTradeHistory(newHistory);
                }
            }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const GlobalContextConsumer = GlobalContext.Consumer;
