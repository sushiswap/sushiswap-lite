import { useCallback, useContext } from "react";

import { CurrencyAmount, Fetcher, Percent, Router, TokenAmount, Trade, WETH } from "@levx/sushiswap-sdk";
import { ethers } from "ethers";
import { MASTER_CHEF, ROUTER } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { convertToken, getContract } from "../utils";
import useAllCommonPairs from "./useAllCommonPairs";

// tslint:disable-next-line:max-func-body-length
const useSDK = () => {
    const { provider, signer } = useContext(EthersContext);
    const { loadAllCommonPairs } = useAllCommonPairs();
    const allowedSlippage = new Percent("50", "10000"); // 0.05%
    const ttl = 60 * 20;

    const getTrade = useCallback(
        async (fromToken: Token, toToken: Token, fromAmount: ethers.BigNumber) => {
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
        [provider]
    );

    const swap = useCallback(
        async (trade: Trade) => {
            if (signer) {
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
                    return {
                        trade,
                        tx
                    };
                }
            }
        },
        [signer]
    );

    const wrapETH = useCallback(
        async (amount: ethers.BigNumber) => {
            if (signer) {
                const weth = getContract("IWETH", WETH[1].address, signer);
                const gasLimit = await weth.estimateGas.deposit({
                    value: amount
                });
                return await weth.deposit({
                    value: amount,
                    gasLimit
                });
            }
        },
        [signer]
    );

    const unwrapETH = useCallback(
        async (amount: ethers.BigNumber) => {
            if (signer) {
                const weth = getContract("IWETH", WETH[1].address, signer);
                const gasLimit = await weth.estimateGas.withdraw(amount);
                return await weth.withdraw(amount, {
                    gasLimit
                });
            }
        },
        [signer]
    );

    const getPair = useCallback(
        async (fromToken: Token, toToken: Token) => {
            if (provider) {
                const from = convertToken(fromToken);
                const to = convertToken(toToken);
                return await Fetcher.fetchPairData(from, to, provider);
            }
        },
        [provider]
    );

    const addLiquidity = useCallback(
        async (fromToken: Token, toToken: Token, fromAmount: ethers.BigNumber, toAmount: ethers.BigNumber) => {
            if (signer) {
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
                return await router.functions.addLiquidity(...args, {
                    gasLimit: gasLimit.mul(120).div(100)
                });
            }
        },
        [signer]
    );

    const removeLiquidityETH = useCallback(
        async (token: Token, liquidity: ethers.BigNumber, amount: ethers.BigNumber, amountETH: ethers.BigNumber) => {
            if (signer) {
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
                return await router.functions.removeLiquidityETH(...args, {
                    gasLimit: gasLimit.mul(120).div(100)
                });
            }
        },
        [signer]
    );

    const removeLiquidity = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            liquidity: ethers.BigNumber,
            fromAmount: ethers.BigNumber,
            toAmount: ethers.BigNumber
        ) => {
            if (signer) {
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
                return await router.functions.removeLiquidity(...args, {
                    gasLimit: gasLimit.mul(120).div(100)
                });
            }
        },
        [signer]
    );

    const addLiquidityETH = useCallback(
        async (token: Token, amount: ethers.BigNumber, amountETH: ethers.BigNumber) => {
            if (signer) {
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
                return await router.functions.addLiquidityETH(...args, {
                    gasLimit: gasLimit.mul(120).div(100),
                    value: amountETH
                });
            }
        },
        [signer]
    );

    const getExpectedSushiRewardPerBlock = useCallback(
        async (token: LPToken) => {
            if (signer) {
                const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
                const totalAllocPoint = await masterChef.totalAllocPoint();
                const sushiPerBlock = await masterChef.sushiPerBlock();
                const { allocPoint } = await masterChef.poolInfo(token.id);
                return ethers.BigNumber.from(sushiPerBlock)
                    .mul(allocPoint)
                    .div(totalAllocPoint);
            }
        },
        [signer]
    );

    const deposit = useCallback(
        async (lpTokenId: number, amount: ethers.BigNumber) => {
            if (signer) {
                const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
                const gasLimit = await masterChef.estimateGas.deposit(lpTokenId, amount);
                return await masterChef.deposit(lpTokenId, amount, {
                    gasLimit: gasLimit.mul(120).div(100)
                });
            }
        },
        [signer]
    );

    const withdraw = useCallback(
        async (lpTokenId: number, amount: ethers.BigNumber) => {
            if (signer) {
                const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
                const gasLimit = await masterChef.estimateGas.withdraw(lpTokenId, amount);
                return await masterChef.withdraw(lpTokenId, amount, {
                    gasLimit: gasLimit.mul(120).div(100)
                });
            }
        },
        [signer]
    );

    const calculateFee = (fromAmount: ethers.BigNumber) => {
        return fromAmount.mul(3).div(1000);
    };

    return {
        allowedSlippage,
        getTrade,
        swap,
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
        calculateFee
    };
};

const minAmount = (amount: ethers.BigNumber, percent: Percent) => {
    return amount.sub(amount.mul(percent.numerator.toString()).div(percent.denominator.toString()));
};
export default useSDK;
