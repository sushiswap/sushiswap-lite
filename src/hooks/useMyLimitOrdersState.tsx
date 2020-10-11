import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ORDER_BOOK } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { getContract } from "../utils";
import { findOrFetchToken } from "../utils/fetch-utils";
import { Order } from "./useSDK";

export interface MyLimitOrdersState {
    orders?: Order[];
    loading: boolean;
    selectedOrder?: Order;
    setSelectedOrder: (order?: Order) => void;
    onCancel: () => Promise<void>;
    cancelling: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMyLimitOrdersState = () => {
    const { kovanSigner, signer, provider, tokens } = useContext(EthersContext);
    const [orders, setOrders] = useState<Order[]>();
    const [selectedOrder, setSelectedOrder] = useState<Order>();
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useAsyncEffect(async () => {
        if (signer && kovanSigner && provider) {
            const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
            const address = await signer.getAddress();
            const length = await orderBook.numberOfHashesOfMaker(address);
            const LIMIT = 100;
            const array: Order[] = [];
            for (let i = 0; i * LIMIT < length; i++) {
                const hashes = await orderBook.hashesOfMaker(address, i * LIMIT, LIMIT);
                for (const hash of hashes) {
                    if (hash !== ethers.constants.HashZero) {
                        const order = await orderBook.orderOfHash(hash);
                        array.push(
                            new Order(
                                signer,
                                await findOrFetchToken(provider, order.fromToken, tokens),
                                await findOrFetchToken(provider, order.toToken, tokens),
                                order.amountIn,
                                order.amountOutMin,
                                order.recipient,
                                order.deadline
                            )
                        );
                    }
                }
            }
            setOrders(array);
            setLoading(false);
        }
    }, [kovanSigner, signer, provider]);

    const onCancel = useCallback(async () => {}, []);

    return {
        orders,
        loading,
        selectedOrder,
        setSelectedOrder,
        onCancel,
        cancelling
    };
};

export default useMyLimitOrdersState;
