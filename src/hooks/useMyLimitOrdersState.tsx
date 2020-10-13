import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ORDER_BOOK, SETTLEMENT } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { getContract } from "../utils";
import { findOrFetchToken } from "../utils/fetch-utils";
import useSDK, { Order } from "./useSDK";

export interface OrderInfo {
    status: number;
    filledAmountIn: ethers.BigNumber;
}

export interface MyLimitOrdersState {
    lastTimeRefreshed: number;
    orders?: Order[];
    loading: boolean;
    selectedOrder?: Order;
    setSelectedOrder: (order?: Order) => void;
    orderInfo?: OrderInfo;
    onCancelOrder: () => Promise<void>;
    cancellingOrder: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMyLimitOrdersState = () => {
    const { cancelOrder } = useSDK();
    const { kovanSigner, signer, provider, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [orders, setOrders] = useState<Order[]>();
    const [selectedOrder, setSelectedOrder] = useState<Order>();
    const [orderInfo, setOrderInfo] = useState<OrderInfo>();
    const [loading, setLoading] = useState(true);
    const [cancellingOrder, setCancellingOrder] = useState(false);

    // tslint:disable-next-line:max-func-body-length
    const updateOrders = async () => {
        if (signer && kovanSigner && provider && tokens) {
            const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
            const address = await signer.getAddress();
            const length = await orderBook.numberOfHashesOfMaker(address);
            const LIMIT = 20;
            const pages: number[] = [];
            for (let i = 0; i * LIMIT < length; i++) {
                pages.push(i);
            }
            const hashes = (
                await Promise.all(
                    pages.map(async page => {
                        return await orderBook.allHashes(page, LIMIT);
                    })
                )
            ).flat();
            const myOrders = await Promise.all(
                hashes
                    .filter(hash => hash !== ethers.constants.HashZero)
                    .map(async hash => {
                        const order = await orderBook.orderOfHash(hash);
                        return new Order(
                            signer,
                            await findOrFetchToken(provider, order.fromToken, tokens),
                            await findOrFetchToken(provider, order.toToken, tokens),
                            order.amountIn,
                            order.amountOutMin,
                            order.recipient,
                            order.deadline
                        );
                    })
            );
            setOrders(myOrders);
            setLoading(false);
        }
    };

    useAsyncEffect(updateOrders, [kovanSigner, signer, provider, tokens, lastTimeRefreshed]);

    useAsyncEffect(async () => {
        setOrderInfo(undefined);
        if (signer && selectedOrder) {
            const settlement = await getContract("Settlement", SETTLEMENT, signer);
            setOrderInfo(await settlement.orderInfoOfHash(await selectedOrder.hash()));
        }
    }, [signer, selectedOrder]);

    const onCancelOrder = useCallback(async () => {
        if (selectedOrder && signer && kovanSigner) {
            setCancellingOrder(true);
            try {
                const hash = await selectedOrder.hash();
                const tx = await cancelOrder(hash, signer, kovanSigner);
                await tx.wait();
                setSelectedOrder(undefined);
                setLastTimeRefreshed(Date.now());
            } finally {
                setCancellingOrder(false);
            }
        }
    }, [selectedOrder, signer, kovanSigner]);

    return {
        lastTimeRefreshed,
        orders,
        loading,
        selectedOrder,
        setSelectedOrder,
        orderInfo,
        onCancelOrder,
        cancellingOrder
    };
};

export default useMyLimitOrdersState;
