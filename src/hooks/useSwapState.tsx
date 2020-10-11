import { useCallback, useContext, useEffect, useState } from "react";

import { Trade } from "@sushiswap/sdk";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import { formatBalance, isEmptyValue, parseBalance } from "../utils";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export type OrderType = "market" | "limit";

export interface SwapState extends TokenPairState {
    orderType: OrderType;
    setOrderType: (orderType: OrderType) => void;
    trade?: Trade;
    unsupported: boolean;
    limitOrderUnsupported: boolean;
    limitOrderPrice: string;
    setLimitOrderPrice: (price: string) => void;
    swapFee: string;
    limitOrderFee: string;
    limitOrderSwapFee: string;
    onSwap: () => Promise<void>;
    swapping: boolean;
    onCreateOrder: () => Promise<void>;
    creatingOrder: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useSwapState: () => SwapState = () => {
    const state = useTokenPairState();
    const { signer, kovanSigner, updateTokens } = useContext(EthersContext);
    const { getTrade, swap, createOrder, calculateSwapFee, calculateLimitOrderFee } = useSDK();
    const [loading, setLoading] = useState(true);
    const [orderType, setOrderType] = useState<OrderType>("market");
    const [trade, setTrade] = useState<Trade>();
    const [unsupported, setUnsupported] = useState(false);
    const [swapFee, setSwapFee] = useState("");
    const [limitOrderPrice, setLimitOrderPrice] = useState<string>("");
    const [limitOrderFee, setLimitOrderFee] = useState("");
    const [limitOrderSwapFee, setLimitOrderSwapFee] = useState("");
    const [swapping, setSwapping] = useState(false);
    const [creatingOrder, setCreatingOrder] = useState(false);

    useEffect(() => {
        setLimitOrderPrice("");
    }, [orderType]);

    useEffect(() => {
        if (isEmptyValue(state.fromAmount)) {
            setLimitOrderPrice("");
        }
    }, [state.fromAmount]);

    useDelayedOnBlockEffect(
        async block => {
            if (!block) {
                setLoading(true);
            }
            if (state.fromToken && state.toToken && state.fromAmount && signer?.provider) {
                const amount = parseBalance(state.fromAmount, state.fromToken.decimals);
                if (!amount.isZero()) {
                    setUnsupported(false);
                    try {
                        setTrade(await getTrade(state.fromToken, state.toToken, amount, signer?.provider));
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
    }, [orderType, trade, state.fromAmount, state.toAmount]);

    const onSwap = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && signer && trade) {
            setSwapping(true);
            try {
                const result = await swap(trade, signer);
                if (result) {
                    await result.tx.wait();
                    await updateTokens();
                    state.setFromSymbol("");
                }
            } finally {
                setSwapping(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, signer, trade]);

    const onCreateOrder = useCallback(async () => {
        const price = Fraction.parse(limitOrderPrice);
        if (state.fromToken && state.toToken && state.fromAmount && signer && kovanSigner && !price.isNaN()) {
            setCreatingOrder(true);
            try {
                const amountIn = parseBalance(state.fromAmount, state.fromToken.decimals);
                const tx = await createOrder(
                    state.fromToken,
                    state.toToken,
                    amountIn,
                    price.apply(amountIn),
                    signer,
                    kovanSigner
                );
                await tx.wait();
                state.setFromSymbol("");
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
        trade,
        unsupported,
        swapFee,
        limitOrderPrice,
        setLimitOrderPrice,
        limitOrderFee,
        limitOrderSwapFee,
        onSwap,
        swapping,
        limitOrderUnsupported: orderType === "limit" && (state.fromSymbol === "ETH" || state.toSymbol === "ETH"),
        onCreateOrder,
        creatingOrder
    };
};

export default useSwapState;
