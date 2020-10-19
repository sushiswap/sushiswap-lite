import { FACTORY_ADDRESS as SUSHISWAP_FACTORY } from "@sushiswap/sdk";
import { FACTORY_ADDRESS as UNISWAP_FACTORY } from "@uniswap/sdk";
import { ethers } from "ethers";
import { LP_TOKEN_SCANNER, MASTER_CHEF } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { getContract } from "./index";

export const fetchTokens = async (address: string, provider?: ethers.providers.JsonRpcProvider) => {
    if (provider) {
        const response = await fetch("https://sushiswap.levx.io/tokens.json");
        const json = await response.json();

        const balances = await provider.send("alchemy_getTokenBalances", [
            address,
            json.tokens.map(token => token.address)
        ]);
        return [
            {
                ...ETH,
                balance: await provider.getBalance(address)
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
        return await fetchLPTokens(SUSHISWAP_FACTORY, tokens, provider, signer);
    }
};

export const fetchMyUniswapLPTokens = async (
    tokens: Token[],
    provider?: ethers.providers.JsonRpcProvider,
    signer?: ethers.Signer
) => {
    if (provider && signer) {
        return await fetchLPTokens(UNISWAP_FACTORY, tokens, provider, signer);
    }
};

const fetchLPTokens = async (
    factory: string,
    tokens: Token[],
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.Signer
) => {
    const factoryContract = getContract("IUniswapV2Factory", factory, signer);
    const length = await factoryContract.allPairsLength();
    const scanner = getContract("LPTokenScanner", LP_TOKEN_SCANNER, signer);
    const account = await signer.getAddress();
    let pairs: any[] = [];
    for (let i = 0; i < length; i += 5000) {
        pairs = pairs.concat(await scanner.findPairs(account, factory, i, Math.min(i + 5000, length.toNumber())));
    }
    const balances = await scanner.findBalances(
        account,
        pairs.map(pair => pair.token)
    );
    const result = await Promise.all(
        pairs.map(async (pair, index) => {
            const address = pair.token;
            const balance = balances[index].balance;
            const contract = getContract("IUniswapV2Pair", address, signer);
            const erc20 = getContract("ERC20", address, signer);
            const decimals = Number(await erc20.decimals());
            const totalSupply = await erc20.totalSupply();
            const tokenA = await findOrFetchToken(provider, await contract.token0(), tokens);
            const tokenB = await findOrFetchToken(provider, await contract.token1(), tokens);
            const name = tokenA.symbol + "-" + tokenB.symbol + " LP Token";
            const symbol = tokenA.symbol + "-" + tokenB.symbol;
            return { address, decimals, name, symbol, balance, totalSupply, tokenA, tokenB } as LPToken;
        })
    );
    return result.filter(token => !!token) as LPToken[];
};

export const findOrFetchToken = async (
    provider: ethers.providers.JsonRpcProvider,
    address: string,
    tokens?: Token[]
) => {
    if (tokens) {
        const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
        if (token) {
            return token;
        }
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
