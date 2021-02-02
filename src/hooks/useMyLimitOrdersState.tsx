import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { fetchMyLimitOrders } from "../utils/fetch-utils";
import useSettlement, { Order } from "./useSettlement";

export interface MyLimitOrdersState {
    lastTimeRefreshed: number;
    myOrders?: Order[];
    loading: boolean;
    selectedOrder?: Order;
    setSelectedOrder: (order?: Order) => void;
    onCancelOrder: () => Promise<void>;
    cancellingOrder: boolean;
    filledEvents?: ethers.Event[];
}

// tslint:disable-next-line:max-func-body-length
const useMyLimitOrdersState = () => {
    const { cancelOrder, queryOrderCanceledEvents, queryOrderFilledEvents } = useSettlement();
    const { chainId, provider, signer, address, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [myOrders, setMyOrders] = useState<Order[]>();
    const [selectedOrder, setSelectedOrder] = useState<Order>();
    const [loading, setLoading] = useState(true);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [filledEvents, setFilledEvents] = useState<ethers.Event[]>();

    const updateOrders = async () => {
        if (provider && signer && address && tokens) {
            setLoading(true);
            try {
                const canceledHashes = (await queryOrderCanceledEvents(signer)).map(event => event.args![0] as string);
                const orders = await fetchMyLimitOrders(provider, signer, tokens, canceledHashes);
                setMyOrders(orders);
            } finally {
                setLoading(false);
            }
        }
    };

    useAsyncEffect(updateOrders, [provider, signer, address, tokens, lastTimeRefreshed]);

    useAsyncEffect(async () => {
        setFilledEvents(undefined);
        if (selectedOrder && signer) {
            setFilledEvents(await queryOrderFilledEvents(await selectedOrder.hash(), signer));
        }
    }, [selectedOrder, queryOrderFilledEvents]);

    const onCancelOrder = useCallback(async () => {
        if (selectedOrder && signer) {
            setCancellingOrder(true);
            try {
                const tx = await cancelOrder(selectedOrder, signer);
                await tx.wait();
                setSelectedOrder(undefined);
                setLastTimeRefreshed(Date.now());
            } finally {
                setCancellingOrder(false);
            }
        }
    }, [chainId, selectedOrder, signer]);

    return {
        lastTimeRefreshed,
        myOrders,
        loading,
        selectedOrder,
        setSelectedOrder,
        onCancelOrder,
        cancellingOrder,
        filledEvents
    };
};

export default useMyLimitOrdersState;
