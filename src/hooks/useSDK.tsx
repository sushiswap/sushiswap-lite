import { useCallback } from "react";

import { CurrencyAmount, Fetcher, Percent, Router, TokenAmount, Trade, WETH } from "@sushiswap/sdk";
import { ethers } from "ethers";
import { MASTER_CHEF, MIGRATOR2, ORDER_BOOK, ROUTER, SETTLEMENT, SUSHI_BAR } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { convertToken, getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import useAllCommonPairs from "./useAllCommonPairs";

// tslint:disable-next-line:max-func-body-length
const useSDK = () => {
    const { loadAllCommonPairs } = useAllCommonPairs();
    const allowedSlippage = new Percent("50", "10000"); // 0.05%
    const ttl = 60 * 20;

    const getTrade = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            fromAmount: ethers.BigNumber,
            provider: ethers.providers.BaseProvider
        ) => {
            if (provider) {
                const isETH = fromToken.symbol === "ETH";
                const from = convertToken(fromToken);
                const to = convertToken(toToken);
                const pairs = await loadAllCommonPairs(from, to, provider);
                const amount = isETH
                    ? CurrencyAmount.ether(fromAmount.toString())
                    : new TokenAmount(from, fromAmount.toString());
                return Trade.bestTradeExactIn(pairs, amount, to, { maxHops: 3, maxNumResults: 1 })[0];
            }
        },
        []
    );

    const swap = useCallback(async (trade: Trade, signer: ethers.Signer) => {
        if (trade) {
            const params = Router.swapCallParameters(trade, {
                feeOnTransfer: false,
                allowedSlippage,
                recipient: await signer.getAddress(),
                ttl
            });
            const router = getContract("IUniswapV2Router02", ROUTER, signer);
            const gasLimit = await router.estimateGas[params.methodName](...params.args, {
                value: params.value
            });
            const tx = await router.functions[params.methodName](...params.args, {
                value: params.value,
                gasLimit: gasLimit.mul(120).div(100)
            });
            await logTransaction(
                tx,
                "UniswapV2Router02." + params.methodName + "()",
                ...params.args.map(arg => arg.toString())
            );
            return {
                trade,
                tx
            };
        }
    }, []);

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
            const gasLimit = await orderBook.estimateGas.createOrder(...args);
            const tx = await orderBook.createOrder(...args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return await logTransaction(tx, "OrderBook.createOrder()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const cancelOrder = useCallback(async (hash: string, signer: ethers.Signer, kovanSigner: ethers.Signer) => {
        const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
        const callHash = await orderBook.cancelOrderCallHash(hash);
        const signature = await signer.signMessage(ethers.utils.arrayify(callHash));
        const { v, r, s } = ethers.utils.splitSignature(signature);
        const args = [hash, v, r, s];

        const gasLimit = await orderBook.estimateGas.cancelOrder(...args);
        const tx = await orderBook.cancelOrder(...args, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return await logTransaction(tx, "OrderBook.cancelOrder()", ...args.map(arg => arg.toString()));
    }, []);

    const wrapETH = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const weth = getContract("IWETH", WETH[1].address, signer);
        const gasLimit = await weth.estimateGas.deposit({
            value: amount
        });
        const tx = await weth.deposit({
            value: amount,
            gasLimit
        });
        return await logTransaction(tx, "WETH.deposit()");
    }, []);

    const unwrapETH = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const weth = getContract("IWETH", WETH[1].address, signer);
        const gasLimit = await weth.estimateGas.withdraw(amount);
        const tx = await weth.withdraw(amount, {
            gasLimit
        });
        return await logTransaction(tx, "WETH.withdraw()");
    }, []);

    const getPair = useCallback(async (fromToken: Token, toToken: Token, provider: ethers.providers.BaseProvider) => {
        const from = convertToken(fromToken);
        const to = convertToken(toToken);
        return await Fetcher.fetchPairData(from, to, provider);
    }, []);

    const addLiquidity = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            fromAmount: ethers.BigNumber,
            toAmount: ethers.BigNumber,
            signer: ethers.Signer
        ) => {
            const router = getContract("IUniswapV2Router02", ROUTER, signer);
            const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`;
            const args = [
                fromToken.address,
                toToken.address,
                fromAmount,
                toAmount,
                minAmount(fromAmount, allowedSlippage),
                minAmount(toAmount, allowedSlippage),
                await signer.getAddress(),
                deadline
            ];
            const gasLimit = await router.estimateGas.addLiquidity(...args);
            const tx = await router.functions.addLiquidity(...args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "UniswapV2Router02.addLiquidity()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const removeLiquidityETH = useCallback(
        async (
            token: Token,
            liquidity: ethers.BigNumber,
            amount: ethers.BigNumber,
            amountETH: ethers.BigNumber,
            signer: ethers.Signer
        ) => {
            const router = getContract("IUniswapV2Router02", ROUTER, signer);
            const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`;
            const args = [
                token.address,
                liquidity,
                minAmount(amount, allowedSlippage),
                minAmount(amountETH, allowedSlippage),
                await signer.getAddress(),
                deadline
            ];
            const gasLimit = await router.estimateGas.removeLiquidityETH(...args);
            const tx = await router.functions.removeLiquidityETH(...args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "UniswapV2Router02.removeLiquidityETH()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const removeLiquidity = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            liquidity: ethers.BigNumber,
            fromAmount: ethers.BigNumber,
            toAmount: ethers.BigNumber,
            signer: ethers.Signer
        ) => {
            const router = getContract("IUniswapV2Router02", ROUTER, signer);
            const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`;
            const args = [
                fromToken.address,
                toToken.address,
                liquidity,
                minAmount(fromAmount, allowedSlippage),
                minAmount(toAmount, allowedSlippage),
                await signer.getAddress(),
                deadline
            ];
            const gasLimit = await router.estimateGas.removeLiquidity(...args);
            const tx = await router.functions.removeLiquidity(...args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "UniswapV2Router02.removeLiquidity()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const addLiquidityETH = useCallback(
        async (token: Token, amount: ethers.BigNumber, amountETH: ethers.BigNumber, signer: ethers.Signer) => {
            const router = getContract("IUniswapV2Router02", ROUTER, signer);
            const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`;
            const args = [
                token.address,
                amount,
                minAmount(amount, allowedSlippage),
                minAmount(amountETH, allowedSlippage),
                await signer.getAddress(),
                deadline
            ];
            const gasLimit = await router.estimateGas.addLiquidityETH(...args, {
                value: amountETH
            });
            const tx = await router.functions.addLiquidityETH(...args, {
                gasLimit: gasLimit.mul(120).div(100),
                value: amountETH
            });
            return logTransaction(tx, "UniswapV2Router02.addLiquidityETH()", ...args.map(arg => arg.toString()));
        },
        []
    );

    const getExpectedSushiRewardPerBlock = useCallback(async (token: LPToken, signer: ethers.Signer) => {
        const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
        const totalAllocPoint = await masterChef.totalAllocPoint();
        const sushiPerBlock = await masterChef.sushiPerBlock();
        const { allocPoint } = await masterChef.poolInfo(token.id);
        return ethers.BigNumber.from(sushiPerBlock)
            .mul(allocPoint)
            .div(totalAllocPoint);
    }, []);

    const deposit = useCallback(async (lpTokenId: number, amount: ethers.BigNumber, signer: ethers.Signer) => {
        const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
        const gasLimit = await masterChef.estimateGas.deposit(lpTokenId, amount);
        const tx = await masterChef.deposit(lpTokenId, amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "MasterChef.deposit()", lpTokenId, amount.toString());
    }, []);

    const withdraw = useCallback(async (lpTokenId: number, amount: ethers.BigNumber, signer: ethers.Signer) => {
        const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
        const gasLimit = await masterChef.estimateGas.withdraw(lpTokenId, amount);
        const tx = await masterChef.withdraw(lpTokenId, amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "MasterChef.withdraw()", lpTokenId, amount.toString());
    }, []);

    const enterSushiBar = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const sushiBar = getContract("SushiBar", SUSHI_BAR, signer);
        const gasLimit = await sushiBar.estimateGas.enter(amount);
        const tx = await sushiBar.enter(amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "SushiBar.enter()", amount.toString());
    }, []);

    const leaveSushiBar = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const sushiBar = getContract("SushiBar", SUSHI_BAR, signer);
        const gasLimit = await sushiBar.estimateGas.leave(amount);
        const tx = await sushiBar.leave(amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "SushiBar.leave()", amount.toString());
    }, []);

    const migrate = useCallback(async (lpToken: LPToken, amount: ethers.BigNumber, signer: ethers.Signer) => {
        const migrator2 = getContract("Migrator2", MIGRATOR2, signer);
        const deadline = `0x${(Math.floor(new Date().getTime() / 1000) + ttl).toString(16)}`;
        const args = [
            lpToken.tokenA.address,
            lpToken.tokenB.address,
            amount,
            ethers.constants.Zero,
            ethers.constants.Zero,
            deadline
        ];
        const gasLimit = await migrator2.estimateGas.migrate(...args);
        const tx = await migrator2.migrate(...args, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "Migrator2.migrate()", ...args.map(arg => arg.toString()));
    }, []);

    const calculateSwapFee = (fromAmount: ethers.BigNumber) => {
        return fromAmount.mul(3).div(1000);
    };

    const calculateLimitOrderFee = (fromAmount: ethers.BigNumber) => {
        return fromAmount.mul(2).div(1000);
    };

    return {
        allowedSlippage,
        getTrade,
        swap,
        createOrder,
        cancelOrder,
        wrapETH,
        unwrapETH,
        getPair,
        addLiquidity,
        addLiquidityETH,
        removeLiquidity,
        removeLiquidityETH,
        getExpectedSushiRewardPerBlock,
        deposit,
        withdraw,
        enterSushiBar,
        leaveSushiBar,
        migrate,
        calculateSwapFee,
        calculateLimitOrderFee
    };
};

const minAmount = (amount: ethers.BigNumber, percent: Percent) => {
    return amount.sub(amount.mul(percent.numerator.toString()).div(percent.denominator.toString()));
};

export type OrderStatus = "Open" | "Expired" | "Filled";

export class Order {
    maker: ethers.Signer;
    fromToken: Token;
    toToken: Token;
    amountIn: ethers.BigNumber;
    amountOutMin: ethers.BigNumber;
    recipient: string;
    deadline: ethers.BigNumber;
    filledAmountIn?: ethers.BigNumber;

    constructor(
        maker: ethers.Signer,
        fromToken: Token,
        toToken: Token,
        amountIn: ethers.BigNumber,
        amountOutMin: ethers.BigNumber,
        recipient: string,
        deadline = ethers.BigNumber.from(Math.floor(Date.now() / 1000 + 24 * 3600))
    ) {
        this.maker = maker;
        this.fromToken = fromToken;
        this.toToken = toToken;
        this.amountIn = amountIn;
        this.amountOutMin = amountOutMin;
        this.recipient = recipient;
        this.deadline = deadline;
    }

    status(): OrderStatus {
        return this.deadline.toNumber() * 1000 < Date.now()
            ? "Expired"
            : this.filledAmountIn?.eq(this.amountIn)
            ? "Filled"
            : "Open";
    }

    async hash() {
        const settlement = await getContract("Settlement", SETTLEMENT, this.maker);
        return await settlement.hash(
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
        const { v, r, s } = await this.sign();
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

export default useSDK;
