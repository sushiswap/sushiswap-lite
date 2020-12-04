import { useCallback, useContext, useEffect, useState } from "react";

import { Pair } from "@sushiswap/sdk";
import { EthersContext } from "../context/EthersContext";
import { convertToken, isETH, parseBalance } from "../utils";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useSDK from "./useSDK";
import useSwapRouter from "./useSwapRouter";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";
import useZapper from "./useZapper";

export type AddLiquidityMode = "normal" | "zapper";

export interface AddLiquidityState extends TokenPairState {
    mode?: AddLiquidityMode;
    setMode: (mode?: AddLiquidityMode) => void;
    pair?: Pair;
    priceDetermined: boolean;
    onAdd: () => Promise<void>;
    adding: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useAddLiquidityState: () => AddLiquidityState = () => {
    const state = useTokenPairState();
    const { provider, signer, updateTokens } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<AddLiquidityMode>();
    const [pair, setPair] = useState<Pair>();
    const [adding, setAdding] = useState(false);
    const { getPair } = useSDK();
    const { addLiquidity, addLiquidityETH } = useSwapRouter();
    const { zapIn } = useZapper();
    const priceDetermined =
        !!pair &&
        !!state.toToken &&
        !pair
            .priceOf(convertToken(state.toToken))
            .denominator.toString()
            .startsWith("0");

    useEffect(() => {
        setPair(undefined);
        state.setFromSymbol("");
    }, [mode]);

    useDelayedOnBlockEffect(
        async block => {
            if (!block) {
                setLoading(true);
                setPair(undefined);
            }
            if (state.fromToken && state.toToken && provider) {
                try {
                    setPair(await getPair(state.fromToken, state.toToken, provider));
                } catch (e) {
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        },
        () => "getPair(" + state.fromSymbol + "," + state.toSymbol + ")",
        [state.fromSymbol, state.toSymbol, provider],
        0
    );

    const onAdd = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && state.toAmount && provider && signer) {
            setAdding(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken.decimals);
                if (mode === "zapper") {
                    const tx = await zapIn(state.fromToken, state.toToken, fromAmount, provider, signer);
                    await tx.wait();
                } else if (isETH(state.fromToken) || isETH(state.toToken)) {
                    const [token, amount, amountETH] = isETH(state.fromToken)
                        ? [state.toToken, toAmount, fromAmount]
                        : [state.fromToken, fromAmount, toAmount];
                    const tx = await addLiquidityETH(token, amount, amountETH, signer);
                    await tx.wait();
                } else {
                    const tx = await addLiquidity(state.fromToken, state.toToken, fromAmount, toAmount, signer);
                    await tx.wait();
                }
                await updateTokens();
                state.setFromSymbol("");
            } finally {
                setAdding(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, state.toAmount, provider, signer]);

    return {
        ...state,
        loading: loading || state.loading,
        mode,
        setMode,
        pair,
        priceDetermined,
        onAdd,
        adding
    };
};

export default useAddLiquidityState;
