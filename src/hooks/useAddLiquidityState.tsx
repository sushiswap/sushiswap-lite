import { useCallback, useContext, useEffect, useState } from "react";

import { Pair, TokenAmount } from "@levx/sushiswap-sdk";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { parseBalance } from "../utils";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface AddLiquidityState extends TokenPairState {
    loading: boolean;
    pair?: Pair;
    onAdd: () => Promise<void>;
    adding: boolean;
    updateFromAmount: () => void;
    updateToAmount: () => void;
}

// tslint:disable-next-line:max-func-body-length
const useAddLiquidityState: () => AddLiquidityState = () => {
    const state = useTokenPairState();
    const { provider, signer, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const { updateTokens } = useContext(GlobalContext);
    const [loading, setLoading] = useState(false);
    const [pair, setPair] = useState<Pair>();
    const [adding, setAdding] = useState(false);
    const { getPair, addLiquidity } = useSDK();

    useEffect(() => {
        setPair(undefined);
        if (state.fromToken && state.toToken && provider && signer) {
            const updatePair = async () => {
                if (state.fromToken && state.toToken) {
                    try {
                        setPair(await getPair(state.fromToken, state.toToken));
                    } catch (e) {
                    } finally {
                        setLoading(false);
                    }
                }
            };
            setLoading(true);
            updatePair();

            const name = "updatePair(" + state.fromToken.symbol + "," + state.toToken.symbol + ")";
            addOnBlockListener(name, updatePair);
            return () => {
                removeOnBlockListener(name);
            };
        }
    }, [state.fromSymbol, state.toSymbol, provider, signer]);

    const updateToAmount = useCallback(() => {
        if (pair) {
            const fromAmount = new TokenAmount(
                pair.token0,
                parseBalance(state.fromAmount, pair.token0.decimals).toString()
            );
            state.setToAmount(pair.token0Price.quote(fromAmount).toExact());
        }
    }, [pair, state.fromAmount]);

    const updateFromAmount = useCallback(() => {
        if (pair) {
            const toAmount = new TokenAmount(
                pair.token1,
                parseBalance(state.toAmount, pair.token1.decimals).toString()
            );
            state.setFromAmount(pair.token1Price.quote(toAmount).toExact());
        }
    }, [pair, state.toAmount]);

    const onAdd = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && state.toAmount && signer) {
            setAdding(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken.decimals);
                const tx = await addLiquidity(state.fromToken, state.toToken, fromAmount, toAmount);
                await tx.wait();
                await updateTokens();
                state.setFromSymbol("");
            } finally {
                setAdding(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, state.toAmount, signer]);

    return {
        ...state,
        loading,
        pair,
        onAdd,
        adding,
        updateFromAmount,
        updateToAmount
    };
};

export default useAddLiquidityState;
