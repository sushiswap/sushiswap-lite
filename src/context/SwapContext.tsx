import React, { useContext, useEffect, useState } from "react";

import { Trade } from "@uniswap/sdk";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import useSDK, { UNISWAP_ROUTER } from "../hooks/useSDK";
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
    const { provider, signer } = useContext(EthersContext);
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
        setFromAmount("");
    }, [fromSymbol, toSymbol]);
    useAsyncEffect(async () => {
        if (fromSymbol && toSymbol && fromAmount && provider && signer) {
            if (fromToken && toToken) {
                setLoading(true);
                setUnsupported(false);
                setFromTokenAllowed(false);
                const amount = parseBalance(fromAmount, fromToken.decimals);
                try {
                    setTrade(amount.isZero() ? undefined : await getTrade(fromToken, toToken, amount));
                    const allowance = await provider.send("alchemy_getTokenAllowance", [
                        {
                            contract: fromToken.address,
                            owner: await signer.getAddress(),
                            spender: UNISWAP_ROUTER
                        }
                    ]);
                    setFromTokenAllowed(ethers.BigNumber.from(allowance).gte(ethers.BigNumber.from(2).pow("128")));
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.error(e);
                    setUnsupported(true);
                } finally {
                    setLoading(false);
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
