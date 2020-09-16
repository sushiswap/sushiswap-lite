import { useCallback, useContext, useState } from "react";

import { Price } from "@levx/sushiswap-sdk";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { parseBalance } from "../utils";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface AddLiquidityState extends TokenPairState {
    loading: boolean;
    fromTokenPrice?: Price;
    toTokenPrice?: Price;
    onAdd: () => Promise<void>;
    adding: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useAddLiquidityState: () => AddLiquidityState = () => {
    const state = useTokenPairState();
    const { provider, signer } = useContext(EthersContext);
    const { updateTokens } = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [fromTokenPrice, setFromTokenPrice] = useState<Price>();
    const [toTokenPrice, setToTokenPrice] = useState<Price>();
    const [adding, setAdding] = useState(false);
    const { getPrices, addLiquidity, addLiquidityETH } = useSDK();

    useAsyncEffect(async () => {
        setFromTokenPrice(undefined);
        setToTokenPrice(undefined);
        if (state.fromToken && state.toToken && provider && signer) {
            setLoading(true);
            if (state.fromToken && state.toToken) {
                try {
                    const prices = await getPrices(state.fromToken, state.toToken);
                    if (prices) {
                        setFromTokenPrice(prices[0]);
                        setToTokenPrice(prices[1]);
                    }
                } catch (e) {
                } finally {
                    setLoading(false);
                }
            }
        }
    }, [state.fromSymbol, state.toSymbol, provider, signer, getPrices]);

    const onAdd = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && state.toAmount && signer) {
            setAdding(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken.decimals);
                if (state.fromSymbol === "ETH" || state.toSymbol === "ETH") {
                    const [token, amount, amountETH] =
                        state.fromSymbol === "ETH"
                            ? [state.toToken, toAmount, fromAmount]
                            : [state.fromToken, fromAmount, toAmount];
                    const tx = await addLiquidityETH(token, amount, amountETH);
                    await tx.wait();
                } else {
                    const tx = await addLiquidity(state.fromToken, state.toToken, fromAmount, toAmount);
                    await tx.wait();
                }
                await updateTokens();
                state.setFromSymbol("");
            } finally {
                setAdding(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, state.toAmount, signer, updateTokens]);

    return {
        ...state,
        loading: loading || state.loading,
        fromTokenPrice,
        toTokenPrice,
        onAdd,
        adding
    };
};

export default useAddLiquidityState;
