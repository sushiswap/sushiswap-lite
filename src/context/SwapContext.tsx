import React, { useContext, useEffect, useState } from "react";

import { Trade } from "@levx/sushiswap-sdk";
import { ethers } from "ethers";
import useSDK from "../hooks/useSDK";
import Token from "../model/Token";
import { parseBalance } from "../utils";
import { EthersContext } from "./EthersContext";
import { GlobalContext } from "./GlobalContext";

export const SwapContext = React.createContext({
    loading: false,
    fromSymbol: "",
    setFromSymbol: symbol => {},
    toSymbol: "",
    setToSymbol: symbol => {},
    fromToken: undefined as Token | undefined,
    toToken: undefined as Token | undefined,
    fromAmount: "",
    setFromAmount: amount => {},
    fromTokenAllowed: false,
    setFromTokenAllowed: allowed => {},
    trade: undefined as Trade | undefined,
    unsupported: false
});

// tslint:disable-next-line:max-func-body-length
export const SwapContextProvider = ({ children }) => {
    const { tokens } = useContext(GlobalContext);
    const { provider, signer, getTokenAllowance, addOnBlockListener, removeOnBlockListener } = useContext(
        EthersContext
    );
    const { getTrade } = useSDK();
    const [loading, setLoading] = useState(false);
    const [fromSymbol, setFromSymbol] = useState("");
    const [toSymbol, setToSymbol] = useState("");
    const [fromAmount, setFromAmount] = useState("");
    const [fromTokenAllowed, setFromTokenAllowed] = useState(false);
    const [trade, setTrade] = useState<Trade>();
    const [unsupported, setUnsupported] = useState(false);
    const fromToken = tokens.find(token => token.symbol === fromSymbol);
    const toToken = tokens.find(token => token.symbol === toSymbol);
    useEffect(() => {
        if (fromSymbol === "") {
            setToSymbol("");
        }
        setFromAmount("");
    }, [fromSymbol, toSymbol]);
    useEffect(() => {
        setFromSymbol("");
    }, [window.ethereum.selectedAddress]);
    useEffect(() => {
        setTrade(undefined);
        setUnsupported(false);
        setFromTokenAllowed(false);
        if (fromSymbol && toSymbol && fromAmount && provider && signer) {
            if (fromToken && toToken) {
                const amount = parseBalance(fromAmount, fromToken.decimals);
                if (!amount.isZero()) {
                    const updateAllowance = async () => {
                        const allowance = await getTokenAllowance(fromToken.address);
                        setFromTokenAllowed(ethers.BigNumber.from(allowance).gte(ethers.BigNumber.from(2).pow("128")));
                    };
                    const updateTrade = async () => {
                        try {
                            setTrade(await getTrade(fromToken, toToken, amount));
                        } catch (e) {
                            setUnsupported(true);
                        } finally {
                            setLoading(false);
                        }
                    };
                    setLoading(true);
                    updateAllowance().then(updateTrade);
                    addOnBlockListener(updateTrade);
                    return () => {
                        removeOnBlockListener(updateTrade);
                    };
                }
            }
        }
    }, [fromSymbol, toSymbol, fromAmount, provider, signer]);
    return (
        <SwapContext.Provider
            value={{
                loading,
                fromSymbol,
                setFromSymbol,
                toSymbol,
                setToSymbol,
                fromToken,
                toToken,
                fromAmount,
                setFromAmount,
                fromTokenAllowed,
                setFromTokenAllowed,
                trade,
                unsupported
            }}>
            {children}
        </SwapContext.Provider>
    );
};
export const SwapContextConsumer = SwapContext.Consumer;
