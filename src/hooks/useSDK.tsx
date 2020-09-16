import { useCallback, useContext } from "react";

import {
    CurrencyAmount,
    ETHER,
    FACTORY_ADDRESS,
    Fetcher,
    Pair,
    Percent,
    Route,
    Router,
    Token as SDKToken,
    TokenAmount,
    Trade,
    WETH
} from "@levx/sushiswap-sdk";
import { ethers } from "ethers";
import { ETH } from "../constants/tokens";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { convertToken } from "../utils";

// export const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
export const SUSHISWAP_ROUTER = "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f";
export const ROUTER = SUSHISWAP_ROUTER;

// tslint:disable-next-line:max-func-body-length
const useSDK = () => {
    const { provider, signer, chainId } = useContext(EthersContext);
    const { tokens } = useContext(GlobalContext);
    const allowedSlippage = new Percent("50", "10000"); // 0.05%
    const ttl = 60 * 20;

    const getTokensWithBalances = async () => {
        if (provider && signer) {
            const response = await fetch("/tokens.json");
            const json = await response.json();

            const account = await signer.getAddress();
            const balances = await provider.send("alchemy_getTokenBalances", [
                account,
                json.tokens.map(token => token.address)
            ]);
            return [
                {
                    ...ETH,
                    balance: await provider.getBalance(account)
                },
                ...json.tokens.map((token, i) => ({
                    ...token,
                    balance: ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance || 0)
                }))
            ].sort((t1, t2) => {
                return t2.balance
                    .sub(t1.balance)
                    .div(ethers.BigNumber.from(10).pow(10))
                    .toNumber();
            });
        }
    };

    const getLPTokensWithBalances = async () => {
        if (provider && signer && tokens) {
            const factory = getFactory(signer);
            const length = await factory.allPairsLength();
            const pairs = await Promise.all(
                Array.from({ length }).map((_, i) => {
                    return factory.allPairs(i);
                })
            );
            const balances = await provider.send("alchemy_getTokenBalances", [await signer.getAddress(), pairs]);
            const result = await Promise.all(
                pairs.map(async (pair, i) => {
                    const balance = ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance);
                    if (balance.isZero()) {
                        return null;
                    }
                    const tokensForPair = getTokensForPair(pair, chainId, tokens);
                    if (!tokensForPair) {
                        return null;
                    }
                    return {
                        address: pair,
                        decimals: 18,
                        ...tokensForPair,
                        balance
                    } as LPToken;
                })
            );
            return result.filter(token => !!token) as LPToken[];
        }
    };

    const getTrade = useCallback(
        async (fromToken: Token, toToken: Token, fromAmount: ethers.BigNumber) => {
            if (provider) {
                const isETH = fromToken.symbol === "ETH";
                const from = convertToken(fromToken);
                const to = convertToken(toToken);
                const pair = await Fetcher.fetchPairData(from, to, provider);
                const route = new Route([pair], isETH ? ETHER : from, to);
                const amount = isETH
                    ? CurrencyAmount.ether(fromAmount.toString())
                    : new TokenAmount(from, fromAmount.toString());
                return Trade.exactIn(route, amount);
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
                    const router = getRouter(signer);
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
                const weth = getWETH(signer);
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
                const weth = getWETH(signer);
                const gasLimit = await weth.estimateGas.withdraw(amount);
                return await weth.withdraw(amount, {
                    gasLimit
                });
            }
        },
        [signer]
    );

    const getPrices = useCallback(
        async (fromToken: Token, toToken: Token) => {
            if (provider) {
                const from = convertToken(fromToken);
                const to = convertToken(toToken);
                const pair = await Fetcher.fetchPairData(from, to, provider);
                return [pair.priceOf(from), pair.priceOf(to)];
            }
        },
        [provider]
    );

    const addLiquidity = useCallback(
        async (fromToken: Token, toToken: Token, fromAmount: ethers.BigNumber, toAmount: ethers.BigNumber) => {
            if (signer) {
                const router = getRouter(signer);
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

    const addLiquidityETH = useCallback(
        async (token: Token, amount: ethers.BigNumber, amountETH: ethers.BigNumber) => {
            if (signer) {
                const router = getRouter(signer);
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

    const calculateFee = (fromAmount: ethers.BigNumber) => {
        return fromAmount.mul(3).div(1000);
    };

    return {
        allowedSlippage,
        getTokensWithBalances,
        getLPTokensWithBalances,
        getTrade,
        swap,
        wrapETH,
        unwrapETH,
        getPrices,
        addLiquidity,
        addLiquidityETH,
        calculateFee
    };
};

const getRouter = (signer: ethers.Signer) => {
    const { abi } = require("@uniswap/v2-periphery/build/IUniswapV2Router02.json");
    return ethers.ContractFactory.getContract(ROUTER, abi, signer);
};

const getFactory = (signer: ethers.Signer) => {
    const { abi } = require("@uniswap/v2-core/build/IUniswapV2Factory.json");
    return ethers.ContractFactory.getContract(FACTORY_ADDRESS, abi, signer);
};

const getWETH = (signer: ethers.Signer) => {
    const { abi } = require("@uniswap/v2-periphery/build/IWETH.json");
    return ethers.ContractFactory.getContract(WETH["1"].address, abi, signer);
};

const getTokensForPair = (pair: string, chainId: number, tokens: Token[]) => {
    for (let j = 0; j < tokens.length; j++) {
        for (let k = j + 1; k < tokens.length; k++) {
            const tokenA = new SDKToken(chainId, tokens[j].address, tokens[j].decimals);
            const tokenB = new SDKToken(chainId, tokens[k].address, tokens[k].decimals);
            const create2Address = Pair.getAddress(tokenA, tokenB);
            if (create2Address.toLowerCase() === pair.toLowerCase()) {
                const toToken = (address: string) => {
                    return tokens.find(token => token.address === address);
                };
                return { tokenA: toToken(tokenA.address), tokenB: toToken(tokenB.address) };
            }
        }
    }
};

const minAmount = (amount: ethers.BigNumber, percent: Percent) => {
    return amount.sub(amount.mul(percent.numerator.toString()).div(percent.denominator.toString()));
};
export default useSDK;
