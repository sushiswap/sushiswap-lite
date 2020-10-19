import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ORDER_BOOK, SETTLEMENT } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { getContract } from "../utils";
import { findOrFetchToken } from "../utils/fetch-utils";
import useSDK, { Order, OrderStatus } from "./useSDK";

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
    onCancelOrder: () => Promise<void>;
    cancellingOrder: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMyLimitOrdersState = () => {
    const { cancelOrder } = useSDK();
    const { kovanSigner, signer, provider, address, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [orders, setOrders] = useState<Order[]>();
    const [selectedOrder, setSelectedOrder] = useState<Order>();
    const [loading, setLoading] = useState(true);
    const [cancellingOrder, setCancellingOrder] = useState(false);

    // tslint:disable-next-line:max-func-body-length
    const updateOrders = async () => {
        if (signer && kovanSigner && provider && address && tokens) {
            setLoading(true);
            try {
                const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
                const settlement = await getContract("Settlement", SETTLEMENT, signer);
                const length = await orderBook.numberOfHashesOfMaker(address);
                const LIMIT = 20;
                const pages: number[] = [];
                for (let i = 0; i * LIMIT < length; i++) {
                    pages.push(i);
                }
                const hashes = (await Promise.all(pages.map(page => orderBook.allHashes(page, LIMIT)))).flat();
                const myOrders = await Promise.all(
                    hashes
                        .filter(hash => hash !== ethers.constants.HashZero)
                        .map(async hash => {
                            const args = await orderBook.orderOfHash(hash);
                            const order = new Order(
                                signer,
                                await findOrFetchToken(provider, args.fromToken, tokens),
                                await findOrFetchToken(provider, args.toToken, tokens),
                                args.amountIn,
                                args.amountOutMin,
                                args.recipient,
                                args.deadline
                            );
                            order.filledAmountIn = await settlement.filledAmountInOfHash(hash);
                            return order;
                        })
                );
                setOrders(
                    myOrders.sort((o0, o1) => {
                        const status = (s: OrderStatus) => (s === "Open" ? 0 : s === "Filled" ? 1 : 2);
                        const compared = status(o0.status()) - status(o1.status());
                        if (compared === 0) {
                            return o0.deadline.toNumber() - o1.deadline.toNumber();
                        }
                        return compared;
                    }) as Order[]
                );
            } finally {
                setLoading(false);
            }
        }
    };

    useAsyncEffect(updateOrders, [kovanSigner, signer, provider, address, tokens, lastTimeRefreshed]);

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
        onCancelOrder,
        cancellingOrder
    };
};

export default useMyLimitOrdersState;
