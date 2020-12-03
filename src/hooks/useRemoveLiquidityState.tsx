import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ROUTER } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import Token from "../types/Token";
import { convertToken, formatBalance, isWETH, parseBalance, parseCurrencyAmount } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSwapRouter from "./useSwapRouter";
import useZapper from "./useZapper";

export interface RemoveLiquidityState extends LPTokensState {
    outputToken?: Token;
    setOutputToken: (token?: Token) => void;
    onRemove: () => Promise<void>;
    removing: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useRemoveLiquidityState: () => RemoveLiquidityState = () => {
    const state = useLPTokensState("my-lp-tokens");
    const { provider, signer, getTokenAllowance, updateTokens } = useContext(EthersContext);
    const { removeLiquidity, removeLiquidityETH } = useSwapRouter();
    const { zapOut } = useZapper();
    const [loading, setLoading] = useState(false);
    const [outputToken, setOutputToken] = useState<Token>();
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        setOutputToken(undefined);
    }, [state.selectedLPToken]);

    useEffect(() => {
        state.setAmount("");
    }, [outputToken]);

    useAsyncEffect(async () => {
        if (signer && state.selectedLPToken) {
            state.setFromSymbol(state.selectedLPToken.tokenA.symbol);
            state.setToSymbol(state.selectedLPToken.tokenB.symbol);

            setLoading(true);
            state.setSelectedLPTokenAllowed(false);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const allowance = await getTokenAllowance(state.selectedLPToken.address, ROUTER);
                state.setSelectedLPTokenAllowed(ethers.BigNumber.from(allowance).gte(minAllowance));
            } finally {
                setLoading(false);
            }
        } else {
            state.setFromSymbol("");
            state.setToSymbol("");
        }
    }, [signer, state.selectedLPToken]);

    // tslint:disable-next-line:max-func-body-length
    useAsyncEffect(async () => {
        if (
            state.selectedLPToken &&
            state.selectedLPToken.totalSupply &&
            state.pair &&
            state.fromToken &&
            state.toToken
        ) {
            if (state.pair.liquidityToken.address === state.selectedLPToken.address) {
                const fromReserve = parseCurrencyAmount(
                    state.pair.reserveOf(convertToken(state.fromToken)),
                    state.fromToken.decimals
                );
                const toReserve = parseCurrencyAmount(
                    state.pair.reserveOf(convertToken(state.toToken)),
                    state.toToken.decimals
                );
                state.setFromAmount(
                    formatBalance(
                        parseBalance(state.amount, state.selectedLPToken.decimals)
                            .mul(fromReserve)
                            .div(state.selectedLPToken.totalSupply)
                            .toString(),
                        state.selectedLPToken.tokenA.decimals
                    )
                );
                state.setToAmount(
                    formatBalance(
                        parseBalance(state.amount, state.selectedLPToken.decimals)
                            .mul(toReserve)
                            .div(state.selectedLPToken.totalSupply)
                            .toString(),
                        state.selectedLPToken.tokenB.decimals
                    )
                );
            }
        }
    }, [state.selectedLPToken, state.amount, state.pair, state.fromToken, state.toToken, signer]);

    const removeFromRouter = async () => {
        if (state.selectedLPToken && signer) {
            const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
            const toAmount = parseBalance(state.toAmount, state.toToken!.decimals);
            const liquidity = parseBalance(state.amount, state.selectedLPToken.decimals);
            if (isWETH(state.fromToken) || isWETH(state.toToken)) {
                const token = isWETH(state.fromToken) ? state.toToken! : state.fromToken!;
                const amountToRemove = isWETH(state.fromToken) ? toAmount : fromAmount;
                const amountToRemoveETH = isWETH(state.fromToken) ? fromAmount : toAmount;
                const tx = await removeLiquidityETH(token, liquidity, amountToRemove, amountToRemoveETH, signer);
                await tx.wait();
            } else {
                const tx = await removeLiquidity(
                    state.fromToken!,
                    state.toToken!,
                    liquidity,
                    fromAmount,
                    toAmount,
                    signer
                );
                await tx.wait();
            }
        }
    };

    const onRemove = useCallback(async () => {
        if (
            state.fromAmount &&
            state.toAmount &&
            state.selectedLPToken &&
            state.amount &&
            outputToken &&
            provider &&
            signer
        ) {
            setRemoving(true);
            try {
                if (outputToken === state.selectedLPToken) {
                    await removeFromRouter();
                } else {
                    const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                    const tx = await zapOut(state.selectedLPToken, outputToken, amount, provider, signer);
                    await tx.wait();
                }
                await updateTokens();
                await state.updateLPTokens();
                state.setSelectedLPToken(undefined);
            } finally {
                setRemoving(false);
            }
        }
    }, [
        state.fromAmount,
        state.toAmount,
        state.selectedLPToken,
        state.amount,
        state.updateLPTokens,
        removeFromRouter,
        zapOut,
        updateTokens,
        outputToken,
        provider,
        signer
    ]);

    return {
        ...state,
        loading: state.loading || loading,
        outputToken,
        setOutputToken,
        onRemove,
        removing
    };
};

export default useRemoveLiquidityState;
