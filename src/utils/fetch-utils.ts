import { FACTORY_ADDRESS } from "@levx/sushiswap-sdk";
import { ethers } from "ethers";
import { MASTER_CHEF } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { getContract } from "./index";

export const fetchTokens = async (provider?: ethers.providers.JsonRpcProvider, signer?: ethers.Signer) => {
    if (provider && signer) {
        const response = await fetch("https://sushiswap.levx.io/tokens.json");
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

export const fetchPools = async (provider?: ethers.providers.JsonRpcProvider, signer?: ethers.Signer) => {
    if (provider && signer) {
        const response = await fetch("https://sushiswap.levx.io/pools.json");
        const pools = await response.json();
        const address = await signer.getAddress();
        const balances = await provider.send("alchemy_getTokenBalances", [address, pools.map(pool => pool.address)]);
        return (await Promise.all(
            pools.map(async (pool, i) => {
                const poolToken = getContract("ERC20", pool.address, signer);
                const totalDeposited = await poolToken.balanceOf(MASTER_CHEF);
                const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
                const { amount: amountDeposited } = await masterChef.userInfo(i, address);
                const pendingSushi = await masterChef.pendingSushi(i, address);
                return {
                    ...pool,
                    id: i,
                    symbol: pool.tokenA.symbol + "-" + pool.tokenB.symbol + " LP",
                    balance: ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance || 0),
                    totalDeposited,
                    amountDeposited,
                    pendingSushi
                };
            })
        )) as LPToken[];
    }
};

export const fetchMyLPTokens = async (
    tokens: Token[],
    provider?: ethers.providers.JsonRpcProvider,
    signer?: ethers.Signer
) => {
    if (provider && signer) {
        const factory = getContract("IUniswapV2Factory", FACTORY_ADDRESS, signer);
        const length = await factory.allPairsLength();
        const pairs = await Promise.all(
            Array.from({ length }).map((_, i) => {
                return factory.allPairs(i);
            })
        );
        const balances = await provider.send("alchemy_getTokenBalances", [await signer.getAddress(), pairs]);
        const result = await Promise.all(
            pairs.map(async (address, i) => {
                const balance = ethers.BigNumber.from(balances.tokenBalances[i].tokenBalance);
                if (balance.isZero()) {
                    return null;
                }
                const pair = getContract("IUniswapV2Pair", address, signer);
                const erc20 = getContract("ERC20", address, signer);
                const decimals = Number(await erc20.decimals());
                const totalSupply = await erc20.totalSupply();
                const tokenA = await findOrGetToken(await pair.token0(), tokens, provider);
                const tokenB = await findOrGetToken(await pair.token1(), tokens, provider);
                return { address, decimals, balance, totalSupply, tokenA, tokenB } as LPToken;
            })
        );
        return result.filter(token => !!token) as LPToken[];
    }
};

const findOrGetToken = async (address: string, tokens: Token[], provider: ethers.providers.JsonRpcProvider) => {
    const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
    if (token) {
        return token;
    }
    const meta = await provider.send("alchemy_getTokenMetadata", [address]);
    return {
        address,
        symbol: meta.symbol,
        decimals: meta.decimals,
        logoURI: meta.logo,
        balance: ethers.constants.Zero
    } as Token;
};
