import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { convertToken, formatBalance, parseBalance, parseCurrencyAmount } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSDK, { ROUTER } from "./useSDK";

export interface RemoveLiquidityState extends LPTokensState {
    onRemove: () => Promise<void>;
    removing: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useRemoveLiquidityState: () => RemoveLiquidityState = () => {
    const state = useLPTokensState("my-lp-tokens");
    const { provider, signer, getTokenAllowance } = useContext(EthersContext);
    const { updateTokens } = useContext(GlobalContext);
    const { removeLiquidity, removeLiquidityETH } = useSDK();
    const [loading, setLoading] = useState(false);
    const [removing, setRemoving] = useState(false);

    useAsyncEffect(async () => {
        if (provider && signer && state.selectedLPToken) {
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
        }
    }, [provider, signer, state.selectedLPToken]);

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

    const onRemove = useCallback(async () => {
        if (state.fromAmount && state.toAmount && state.selectedLPToken && state.amount && signer) {
            setRemoving(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken!.decimals);
                const liquidity = parseBalance(state.amount, state.selectedLPToken.decimals);
                if (state.fromSymbol === "WETH" || state.toSymbol === "WETH") {
                    const [token, amountToRemove, amountToRemoveETH] =
                        state.fromSymbol === "WETH"
                            ? [state.toToken!, toAmount, fromAmount]
                            : [state.fromToken!, fromAmount, toAmount];
                    const tx = await removeLiquidityETH(token, liquidity, amountToRemove, amountToRemoveETH);
                    await tx.wait();
                } else {
                    const tx = await removeLiquidity(state.fromToken!, state.toToken!, liquidity, fromAmount, toAmount);
                    await tx.wait();
                }
                await updateTokens();
                state.setSelectedLPToken(undefined);
            } finally {
                setRemoving(false);
            }
        }
    }, [state.fromAmount, state.toAmount, state.selectedLPToken, state.amount, signer, updateTokens]);

    return {
        ...state,
        loading: state.loading || loading,
        onRemove,
        removing
    };
};

export default useRemoveLiquidityState;
