import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import LPToken from "../types/LPToken";
import { convertToken, formatBalance, parseBalance, parseCurrencyAmount } from "../utils";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";
import useSDK, { ROUTER } from "./useSDK";

export interface RemoveLiquidityState extends LiquidityState {
    loading: boolean;
    lpTokens: LPToken[];
    selectedLPToken?: LPToken;
    setSelectedLPToken: (token?: LPToken) => void;
    selectedLPTokenAllowed: boolean;
    setSelectedLPTokenAllowed: (allowed: boolean) => void;
    amount: string;
    setAmount: (amount: string) => void;
    onRemove: () => Promise<void>;
    removing: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useRemoveLiquidityState: () => RemoveLiquidityState = () => {
    const state = useLiquidityState();
    const { provider, signer, address, getTokenAllowance } = useContext(EthersContext);
    const { tokens, updateTokens } = useContext(GlobalContext);
    const { getMyLPTokens, removeLiquidity, removeLiquidityETH } = useSDK();
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [amount, setAmount] = useState("");
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        if (!selectedLPToken) {
            setAmount("");
        }
    }, [selectedLPToken]);

    useAsyncEffect(async () => {
        if (provider && signer && tokens) {
            setLoading(true);
            try {
                const data = await getMyLPTokens();
                if (data) {
                    setLPTokens(data);
                }
            } finally {
                setLoading(false);
            }
        }
    }, [provider, signer, tokens, address]);

    useAsyncEffect(async () => {
        if (selectedLPToken && provider && signer) {
            state.setFromSymbol(selectedLPToken.tokenA.symbol);
            state.setToSymbol(selectedLPToken.tokenB.symbol);

            setLoading(true);
            setSelectedLPTokenAllowed(false);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const allowance = await getTokenAllowance(selectedLPToken.address, ROUTER);
                setSelectedLPTokenAllowed(ethers.BigNumber.from(allowance).gte(minAllowance));
            } finally {
                setLoading(false);
            }
        }
    }, [selectedLPToken, provider, signer]);

    useAsyncEffect(async () => {
        if (selectedLPToken && state.pair && state.fromToken && state.toToken) {
            if (state.pair.liquidityToken.address === selectedLPToken.address) {
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
                        parseBalance(amount, selectedLPToken.decimals)
                            .mul(fromReserve)
                            .div(selectedLPToken.totalSupply)
                            .toString(),
                        selectedLPToken.tokenA.decimals
                    )
                );
                state.setToAmount(
                    formatBalance(
                        parseBalance(amount, selectedLPToken.decimals)
                            .mul(toReserve)
                            .div(selectedLPToken.totalSupply)
                            .toString(),
                        selectedLPToken.tokenB.decimals
                    )
                );
            }
        }
    }, [selectedLPToken, amount, state.pair, state.fromToken, state.toToken, signer]);

    const onRemove = useCallback(async () => {
        if (state.fromAmount && state.toAmount && selectedLPToken && amount && signer) {
            setRemoving(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken!.decimals);
                const liquidity = parseBalance(amount, selectedLPToken.decimals);
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
                setSelectedLPToken(undefined);
            } finally {
                setRemoving(false);
            }
        }
    }, [state.fromAmount, state.toAmount, selectedLPToken, amount, signer, updateTokens]);

    return {
        ...state,
        loading: state.loading || loading,
        lpTokens,
        selectedLPToken,
        setSelectedLPToken,
        selectedLPTokenAllowed,
        setSelectedLPTokenAllowed,
        amount,
        setAmount,
        onRemove,
        removing
    };
};

export default useRemoveLiquidityState;
