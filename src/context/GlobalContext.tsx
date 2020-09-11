import React, { useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native-appearance";

import { Trade } from "@levx/sushiswap-sdk";
import AsyncStorage from "@react-native-community/async-storage";
import { ethers } from "ethers";
import { ETH } from "../constants/tokens";
import Token from "../model/Token";
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
    addToTradeHistory: async (address, trade) => {}
});

// tslint:disable-next-line:max-func-body-length
export const GlobalContextProvider = ({ children }) => {
    const { provider, signer, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const colorScheme = useColorScheme();
    const [darkMode, setDarkMode] = useState(colorScheme === "dark");
    const [tokens, setTokens] = useState([ETH]);
    const [loadingTokens, setLoadingTokens] = useState(true);
    const [tradeHistory, setTradeHistory] = useState([] as Trade[]);
    const updateTokens = useCallback(async () => {
        if (provider && signer) {
            try {
                await setTokens(await fetchTokens(provider, signer));
            } finally {
                setLoadingTokens(false);
            }
        }
    }, [provider, signer, fetchTokens]);
    useEffect(() => {
        updateTokens();
        addOnBlockListener(updateTokens);
        return () => {
            removeOnBlockListener(updateTokens);
        };
    }, [updateTokens]);
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

const fetchTokens = async (provider: ethers.providers.JsonRpcProvider, signer: ethers.providers.JsonRpcSigner) => {
    const response = await fetch("/tokens.json");
    const json = await response.json();
    const tokens = json.tokens;

    const account = await signer.getAddress();
    const balances = await provider.send("alchemy_getTokenBalances", [account, tokens.map(token => token.address)]);
    return [
        {
            ...ETH,
            balance: await provider.getBalance(account)
        },
        ...tokens.map((token, i) => ({
            ...token,
            balance: ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance || 0)
        }))
    ].sort((t1, t2) => {
        return t2.balance
            .sub(t1.balance)
            .div(ethers.BigNumber.from(10).pow(10))
            .toNumber();
    });
};

export const GlobalContextConsumer = GlobalContext.Consumer;
