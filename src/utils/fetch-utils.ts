import { FACTORY_ADDRESS as SUSHISWAP_FACTORY } from "@sushiswap/sdk";
import { FACTORY_ADDRESS as UNISWAP_FACTORY } from "@uniswap/sdk";
import { ethers } from "ethers";
import { LP_TOKEN_SCANNER, MASTER_CHEF, ORDER_BOOK, SETTLEMENT } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import { Order, OrderStatus } from "../hooks/useSDK";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { getContract } from "./index";

export const fetchTokens = async (
    address: string,
    provider: ethers.providers.BaseProvider,
    signer: ethers.Signer,
    customTokens?: Token[]
) => {
    const response = await fetch("https://lite.sushiswap.fi/tokens.json");
    const json = await response.json();
    const tokens = [...json.tokens, ...(customTokens || [])];

    const balances = await fetchTokenBalances(
        tokens.map(token => token.address),
        signer
    );
    return [
        {
            ...ETH,
            balance: await provider.getBalance(address)
        },
        ...tokens.map((token, i) => ({
            ...token,
            balance: ethers.BigNumber.from(balances[i] || 0)
        }))
    ].sort((t1, t2) => {
        return t2.balance
            .sub(t1.balance)
            .div(ethers.BigNumber.from(10).pow(10))
            .toNumber();
    });
};

export const fetchPools = async (provider: ethers.providers.JsonRpcProvider, signer: ethers.Signer) => {
    const response = await fetch("https://lite.sushiswap.fi/pools.json");
    const pools = await response.json();
    const address = await signer.getAddress();
    const balances = await fetchTokenBalances(
        pools.map(pool => pool.address),
        signer
    );
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
                balance: ethers.BigNumber.from(balances[i] || 0),
                totalDeposited,
                amountDeposited,
                pendingSushi
            };
        })
    )) as LPToken[];
};

export const fetchMyLPTokens = async (
    tokens: Token[],
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.Signer
) => {
    return await fetchLPTokens(SUSHISWAP_FACTORY, tokens, provider, signer);
};

export const fetchMyUniswapLPTokens = async (
    tokens: Token[],
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.Signer
) => {
    return await fetchLPTokens(UNISWAP_FACTORY, tokens, provider, signer);
};

const LP_TOKENS_LIMIT = 2000;

// tslint:disable-next-line:max-func-body-length
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
    const pages: number[] = [];
    for (let i = 0; i < length; i += LP_TOKENS_LIMIT) pages.push(i);
    const pairs = (
        await Promise.all(
            pages.map(page =>
                scanner.findPairs(account, factory, page, Math.min(page + LP_TOKENS_LIMIT, length.toNumber()))
            )
        )
    ).flat();
    const balances = await fetchTokenBalances(
        pairs.map(pair => pair.token),
        signer
    );
    return await Promise.all(
        pairs.map(async (pair, index) => {
            const address = pair.token;
            const balance = ethers.BigNumber.from(balances[index]);
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
        name: meta.name,
        symbol: meta.symbol,
        decimals: meta.decimals,
        logoURI: meta.logo,
        balance: ethers.constants.Zero
    } as Token;
};

const fetchTokenBalances = async (addresses: string[], signer: ethers.Signer) => {
    const account = await signer.getAddress();
    return await Promise.all(
        addresses.map(async address => {
            const erc20 = getContract("ERC20", address, signer);
            return erc20.balanceOf(account);
        })
    );
};

const LIMIT_ORDERS_LIMIT = 20;

export const fetchMyLimitOrders = async (
    signer: ethers.Signer,
    kovanSigner: ethers.Signer,
    provider: ethers.providers.JsonRpcProvider,
    tokens?: Token[],
    canceledHashes?: string[]
) => {
    const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
    const settlement = await getContract("Settlement", SETTLEMENT, signer);
    const maker = await signer.getAddress();
    const length = await orderBook.numberOfHashesOfMaker(maker);
    const pages: number[] = [];
    for (let i = 0; i * LIMIT_ORDERS_LIMIT < length; i++) pages.push(i);
    const hashes = (await Promise.all(pages.map(page => orderBook.hashesOfMaker(maker, page, LIMIT_ORDERS_LIMIT))))
        .flat()
        .filter(hash => hash !== ethers.constants.HashZero);
    const myOrders = await Promise.all(
        hashes.map(async hash => {
            const args = await orderBook.orderOfHash(hash);
            return new Order(
                signer,
                await findOrFetchToken(provider, args.fromToken, tokens),
                await findOrFetchToken(provider, args.toToken, tokens),
                args.amountIn,
                args.amountOutMin,
                args.recipient,
                args.deadline,
                args.v,
                args.r,
                args.s,
                await settlement.filledAmountInOfHash(hash),
                canceledHashes && canceledHashes.includes(hash)
            );
        })
    );
    return myOrders.sort(compareOrders) as Order[];
};

const compareOrders = (o0, o1) => {
    const status = (s: OrderStatus) => (s === "Open" ? 0 : s === "Filled" ? 1 : 2);
    const compared = status(o0.status()) - status(o1.status());
    return compared === 0 ? o1.deadline.toNumber() - o0.deadline.toNumber() : compared;
};

export const fetchMyCanceledLimitOrderHashes = async (signer: ethers.Signer) => {
    const settlement = await getContract("Settlement", SETTLEMENT, signer);
    const length = await settlement.numberOfCanceledHashesOfMaker(await signer.getAddress());
    const pages: number[] = [];
    for (let i = 0; i * LIMIT_ORDERS_LIMIT < length; i++) pages.push(i);
    return (await Promise.all(pages.map(page => settlement.allCanceledHashes(page, LIMIT_ORDERS_LIMIT))))
        .flat()
        .filter(hash => hash !== ethers.constants.HashZero);
};
