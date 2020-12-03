import { useCallback } from "react";

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
            signer: ethers.Signer,
            kovanSigner: ethers.Signer
        ) => {
            const order = new Order(signer, fromToken, toToken, amountIn, amountOutMin, await signer.getAddress());
            const args = await order.toArgs();

            const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
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
        const args = (await order.toArgs()).slice(0, 7);
        const gasLimit = await settlement.estimateGas.cancelOrder(...args);
        const tx = await settlement.cancelOrder(...args, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return await logTransaction(tx, "Settlement.cancelOrder()", ...args.map(arg => arg.toString()));
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
            .mul(fraction.denominator)
            .div(fraction.numerator)
            .div(pow10(fromToken.decimals));
    };

    return { createOrder, cancelOrder, queryOrderFilledEvents, calculateLimitOrderFee, calculateLimitOrderReturn };
};

export type OrderStatus = "Open" | "Expired" | "Filled" | "Canceled";

export class Order {
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
        const settlement = await getContract("Settlement", SETTLEMENT, this.maker);
        return await settlement.hashOfOrder(
            await this.maker.getAddress(),
            this.fromToken.address,
            this.toToken.address,
            this.amountIn,
            this.amountOutMin,
            this.recipient,
            this.deadline
        );
    }

    async sign() {
        const hash = await this.hash();
        const signature = await this.maker.signMessage(ethers.utils.arrayify(hash));
        return ethers.utils.splitSignature(signature);
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
