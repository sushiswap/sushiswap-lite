import { useCallback, useContext, useEffect, useState } from "react";

import { Trade } from "@levx/sushiswap-sdk";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { parseBalance } from "../utils";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface SwapState extends TokenPairState {
    loading: boolean;
    trade?: Trade;
    unsupported: boolean;
    onSwap: () => Promise<void>;
    swapping: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useSwapState: () => SwapState = () => {
    const state = useTokenPairState();
    const { addToTradeHistory, updateTokens } = useContext(GlobalContext);
    const { provider, signer, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const { getTrade, swap } = useSDK();
    const [loading, setLoading] = useState(true);
    const [trade, setTrade] = useState<Trade>();
    const [unsupported, setUnsupported] = useState(false);
    const [swapping, setSwapping] = useState(false);

    useEffect(() => {
        if (state.fromToken && state.toToken && state.fromAmount && provider && signer) {
            const amount = parseBalance(state.fromAmount, state.fromToken.decimals);
            if (!amount.isZero()) {
                const updateTrade = async () => {
                    if (state.fromToken && state.toToken) {
                        setUnsupported(false);
                        try {
                            setTrade(await getTrade(state.fromToken, state.toToken, amount));
                        } catch (e) {
                            setUnsupported(true);
                        } finally {
                            setLoading(false);
                        }
                    }
                };
                updateTrade();

                const name = "updateTrade(" + state.fromToken.symbol + "," + state.toToken.symbol + ")";
                addOnBlockListener(name, updateTrade);
                return () => {
                    removeOnBlockListener(name);
                };
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, provider, signer]);

    const onSwap = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && signer && trade) {
            setSwapping(true);
            try {
                const result = await swap(trade);
                if (result) {
                    await result.tx.wait();
                    await addToTradeHistory(result.trade);
                    await updateTokens();
                    state.setFromSymbol("");
                }
            } finally {
                setSwapping(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, signer, trade]);

    return {
        ...state,
        loading,
        trade,
        unsupported,
        onSwap,
        swapping
    };
};

export default useSwapState;
