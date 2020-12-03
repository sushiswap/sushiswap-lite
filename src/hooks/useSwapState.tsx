import { useCallback, useContext, useEffect, useState } from "react";

import { Trade } from "@sushiswap/sdk";
import { Fetcher, Token, WETH } from "@uniswap/sdk";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import { formatBalance, isEmptyValue, isETH, isWETH, parseBalance, pow10 } from "../utils";
import useDelayedEffect from "./useDelayedEffect";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useSDK from "./useSDK";
import useSettlement from "./useSettlement";
import useSwapRouter from "./useSwapRouter";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export type OrderType = "market" | "limit";

export interface SwapState extends TokenPairState {
    orderType?: OrderType;
    setOrderType: (orderType?: OrderType) => void;
    priceInETH?: ethers.BigNumber | null;
    trade?: Trade;
    unsupported: boolean;
    limitOrderUnsupported: boolean;
    limitOrderPrice: string;
    setLimitOrderPrice: (price: string) => void;
    swapFee: string;
    limitOrderFee: string;
    limitOrderSwapFee: string;
    limitOrderReturn: string;
    onSwap: () => Promise<void>;
    swapping: boolean;
    onCreateOrder: () => Promise<void>;
    creatingOrder: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useSwapState: () => SwapState = () => {
    const state = useTokenPairState();
    const { chainId, provider, signer, kovanSigner, updateTokens } = useContext(EthersContext);
    const { getTrade } = useSDK();
    const { swap, calculateSwapFee } = useSwapRouter();
    const { calculateLimitOrderFee, calculateLimitOrderReturn } = useSettlement();
    const { createOrder } = useSettlement();
    const [loading, setLoading] = useState(true);
    const [orderType, setOrderType] = useState<OrderType>();
    const [priceInETH, setPriceInETH] = useState<ethers.BigNumber | null>();
    const [trade, setTrade] = useState<Trade>();
    const [unsupported, setUnsupported] = useState(false);
    const [swapFee, setSwapFee] = useState("");
    const [limitOrderPrice, setLimitOrderPrice] = useState<string>("");
    const [limitOrderFee, setLimitOrderFee] = useState("");
    const [limitOrderSwapFee, setLimitOrderSwapFee] = useState("");
    const [limitOrderReturn, setLimitOrderReturn] = useState("");
    const [swapping, setSwapping] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);

    useEffect(() => {
        if (!orderType) {
            state.setFromSymbol("");
        }
        setLimitOrderPrice("");
    }, [orderType]);

    useAsyncEffect(async () => {
        setPriceInETH(undefined);
        if (provider && state.fromToken) {
            if (isWETH(state.fromToken)) {
                setPriceInETH(ethers.constants.WeiPerEther);
            } else {
                try {
                    const fromToken = new Token(chainId, state.fromToken.address, state.fromToken.decimals);
                    const toToken = WETH[chainId];
                    const pair = await Fetcher.fetchPairData(fromToken, toToken, provider);
                    setPriceInETH(parseBalance(pair.priceOf(toToken).toFixed(), fromToken.decimals));
                } catch (e) {
                    setPriceInETH(null);
                }
            }
        }
    }, [chainId, provider, state.fromToken]);

    useDelayedEffect(
        () => {
            if (isEmptyValue(state.fromAmount)) {
                setLimitOrderPrice("");
                setTrade(undefined);
            }
        },
        300,
        [state.fromAmount]
    );

    useDelayedOnBlockEffect(
        async block => {
            if (!block) {
                setLoading(true);
            }
            if (state.fromToken && state.toToken && state.fromAmount && provider) {
                const amount = parseBalance(state.fromAmount, state.fromToken.decimals);
                if (!amount.isZero()) {
                    setUnsupported(false);
                    try {
                        setTrade(await getTrade(state.fromToken, state.toToken, amount, provider));
                    } catch (e) {
                        setUnsupported(true);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        },
        () => "getTrade(" + state.fromSymbol + "," + state.toSymbol + "," + state.fromAmount + ")",
        [state.fromSymbol, state.toSymbol, state.fromAmount]
    );

    useAsyncEffect(() => {
        if (trade && !isEmptyValue(state.fromAmount)) {
            const fromAmount = parseBalance(state.fromAmount, state.fromToken!.decimals);
            setSwapFee(formatBalance(calculateSwapFee(fromAmount), state.fromToken!.decimals, 8));
            if (orderType === "limit") {
                setLimitOrderFee(formatBalance(calculateLimitOrderFee(fromAmount), state.fromToken!.decimals, 8));
                setLimitOrderSwapFee(
                    formatBalance(
                        calculateSwapFee(fromAmount.sub(calculateLimitOrderFee(fromAmount))),
                        state.fromToken!.decimals,
                        8
                    )
                );
            }
        }
    }, [orderType, trade, state.fromAmount]);

    useAsyncEffect(() => {
        if (state.fromToken && state.toToken && !isEmptyValue(state.fromAmount) && !isEmptyValue(limitOrderPrice)) {
            setLimitOrderReturn(
                formatBalance(
                    calculateLimitOrderReturn(
                        state.fromToken,
                        state.toToken,
                        parseBalance(state.fromAmount, state.fromToken.decimals),
                        limitOrderPrice
                    ),
                    state.toToken.decimals
                )
            );
        }
    }, [state.fromToken, state.toToken, state.fromAmount, limitOrderPrice]);

    const onSwap = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && signer && trade) {
            setSwapping(true);
            try {
                const result = await swap(trade, signer);
                if (result) {
                    await result.tx.wait();
                    await updateTokens();
                    setTrade(undefined);
                    setOrderType(undefined);
                }
            } finally {
                setSwapping(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, signer, trade]);

    const onCreateOrder = useCallback(async () => {
        if (
            state.fromToken &&
            state.toToken &&
            state.fromAmount &&
            !isEmptyValue(limitOrderPrice) &&
            signer &&
            kovanSigner
        ) {
            setCreatingOrder(true);
            try {
                const amountIn = parseBalance(state.fromAmount, state.fromToken.decimals);
                const tx = await createOrder(
                    state.fromToken,
                    state.toToken,
                    amountIn,
                    Fraction.parse(limitOrderPrice)
                        .apply(amountIn)
                        .mul(pow10(state.toToken.decimals))
                        .div(pow10(state.fromToken.decimals)),
                    signer,
                    kovanSigner
                );
                await tx.wait();
                setTrade(undefined);
                setOrderType(undefined);
            } finally {
                setCreatingOrder(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, signer, kovanSigner, limitOrderPrice]);

    return {
        ...state,
        loading: loading || state.loading,
        orderType,
        setOrderType,
        priceInETH,
        trade,
        unsupported,
        swapFee,
        limitOrderPrice,
        setLimitOrderPrice,
        limitOrderFee,
        limitOrderSwapFee,
        limitOrderReturn,
        onSwap,
        swapping,
        limitOrderUnsupported: orderType === "limit" && (isETH(state.fromToken) || isETH(state.toToken)),
        onCreateOrder,
        creatingOrder
    };
};

export default useSwapState;
