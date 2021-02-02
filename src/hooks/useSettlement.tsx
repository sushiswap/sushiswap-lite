import { useCallback } from "react";

import { _TypedDataEncoder } from "@ethersproject/hash";
import { signData } from "eth-permit/dist/rpc";
import { ethers } from "ethers";
import { ORDER_BOOK, SETTLEMENT } from "../constants/contracts";
import Fraction from "../constants/Fraction";
import Token from "../types/Token";
import { getContract, pow10 } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import useSwapRouter from "./useSwapRouter";

// tslint:disable-next-line:max-func-body-length
const useSettlement = () => {
    const { calculateSwapFee } = useSwapRouter();

    const createOrder = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            amountIn: ethers.BigNumber,
            amountOutMin: ethers.BigNumber,
            signer: ethers.Signer
        ) => {
            const order = new Order(signer, fromToken, toToken, amountIn, amountOutMin, await signer.getAddress());
            const args = await order.toArgs();

            const orderBook = getContract("OrderBook", ORDER_BOOK, signer);
            const gasLimit = await orderBook.estimateGas.createOrder(args);
            const tx = await orderBook.createOrder(args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return await logTransaction(tx, "OrderBook.createOrder()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const cancelOrder = useCallback(async (order: Order, signer: ethers.Signer) => {
        const settlement = getContract("Settlement", SETTLEMENT, signer);
        const args = await order.toArgs();

        const gasLimit = await settlement.estimateGas.cancelOrder(args);
        const tx = await settlement.cancelOrder(args, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return await logTransaction(tx, "Settlement.cancelOrder()", ...args.map(arg => arg.toString()));
    }, []);

    const queryOrderCanceledEvents = useCallback(async (signer: ethers.Signer) => {
        const settlement = getContract("Settlement", SETTLEMENT, signer);
        const filter = settlement.filters.OrderCanceled(null);
        return await settlement.queryFilter(filter);
    }, []);

    const queryOrderFilledEvents = useCallback(async (hash: string, signer: ethers.Signer) => {
        const settlement = getContract("Settlement", SETTLEMENT, signer);
        const filter = settlement.filters.OrderFilled(hash);
        return await settlement.queryFilter(filter);
    }, []);

    const calculateLimitOrderFee = (fromAmount: ethers.BigNumber) => {
        return fromAmount.mul(2).div(1000);
    };

    const calculateLimitOrderReturn = (
        fromToken: Token,
        toToken: Token,
        fromAmount: ethers.BigNumber,
        price: string
    ) => {
        const limitOrderFeeDeducted = fromAmount.sub(calculateLimitOrderFee(fromAmount));
        const swapFeeDeducted = limitOrderFeeDeducted.sub(calculateSwapFee(limitOrderFeeDeducted));
        const fraction = Fraction.parse(price);
        return swapFeeDeducted
            .mul(pow10(toToken.decimals))
            .mul(fraction.numerator)
            .div(fraction.denominator)
            .div(pow10(fromToken.decimals));
    };

    return {
        createOrder,
        cancelOrder,
        queryOrderCanceledEvents,
        queryOrderFilledEvents,
        calculateLimitOrderFee,
        calculateLimitOrderReturn
    };
};

export type OrderStatus = "Open" | "Expired" | "Filled" | "Canceled";

export class Order {
    static ORDER_TYPEHASH = "0x7c228c78bd055996a44b5046fb56fa7c28c66bce92d9dc584f742b2cd76a140f";

    maker: ethers.Signer;
    fromToken: Token;
    toToken: Token;
    amountIn: ethers.BigNumber;
    amountOutMin: ethers.BigNumber;
    recipient: string;
    deadline: ethers.BigNumber;
    v?: number;
    r?: string;
    s?: string;
    filledAmountIn?: ethers.BigNumber;
    canceled?: boolean;

    constructor(
        maker: ethers.Signer,
        fromToken: Token,
        toToken: Token,
        amountIn: ethers.BigNumber,
        amountOutMin: ethers.BigNumber,
        recipient: string,
        deadline = ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 24 * 3600)),
        v?: number,
        r?: string,
        s?: string,
        filledAmountIn?: ethers.BigNumber,
        canceled?: boolean
    ) {
        this.maker = maker;
        this.fromToken = fromToken;
        this.toToken = toToken;
        this.amountIn = amountIn;
        this.amountOutMin = amountOutMin;
        this.recipient = recipient;
        this.deadline = deadline;
        this.v = v;
        this.r = r;
        this.s = s;
        this.filledAmountIn = filledAmountIn;
        this.canceled = canceled;
    }

    status(): OrderStatus {
        return this.canceled
            ? "Canceled"
            : this.filledAmountIn?.eq(this.amountIn)
            ? "Filled"
            : this.deadline.toNumber() * 1000 < Date.now()
            ? "Expired"
            : "Open";
    }

    async hash() {
        return ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ["bytes32", "address", "address", "address", "uint256", "uint256", "address", "uint256"],
                [
                    Order.ORDER_TYPEHASH,
                    await this.maker.getAddress(),
                    this.fromToken.address,
                    this.toToken.address,
                    this.amountIn,
                    this.amountOutMin,
                    this.recipient,
                    this.deadline
                ]
            )
        );
    }

    async sign() {
        const address = await this.maker.getAddress();
        const domain = {
            name: "OrderBook",
            version: "1",
            chainId: 42,
            verifyingContract: ORDER_BOOK
        };
        const types = {
            Order: [
                { name: "maker", type: "address" },
                { name: "fromToken", type: "address" },
                { name: "toToken", type: "address" },
                { name: "amountIn", type: "uint256" },
                { name: "amountOutMin", type: "uint256" },
                { name: "recipient", type: "address" },
                { name: "deadline", type: "uint256" }
            ]
        };
        const value = {
            maker: address,
            fromToken: this.fromToken.address,
            toToken: this.toToken.address,
            amountIn: this.amountIn,
            amountOutMin: this.amountOutMin,
            recipient: this.recipient,
            deadline: this.deadline
        };
        const payload = _TypedDataEncoder.getPayload(domain, types, value);
        return await signData(window.ethereum, address, payload);
    }

    async toArgs() {
        const { v, r, s } = this.v && this.r && this.s ? { v: this.v, r: this.r, s: this.s } : await this.sign();
        return [
            await this.maker.getAddress(),
            this.fromToken.address,
            this.toToken.address,
            this.amountIn,
            this.amountOutMin,
            this.recipient,
            this.deadline,
            v,
            r,
            s
        ];
    }
}

export default useSettlement;
