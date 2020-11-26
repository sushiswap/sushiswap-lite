import { FACTORY_ADDRESS as SUSHISWAP_FACTORY } from "@sushiswap/sdk";
import sushiData from "@sushiswap/sushi-data";
import { FACTORY_ADDRESS as UNISWAP_FACTORY } from "@uniswap/sdk";
import { ethers } from "ethers";
import { LP_TOKEN_SCANNER, MASTER_CHEF, ORDER_BOOK, SETTLEMENT } from "../constants/contracts";
import { ETH } from "../constants/tokens";
import { ALCHEMY_PROVIDER } from "../context/EthersContext";
import { Order, OrderStatus } from "../hooks/useSDK";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { getContract, parseBalance, pow10 } from "./index";

const blocksPerDay = 6500;
const sushiPerBlock = 80;

export const fetchTokens = async (account: string, customTokens?: Token[]) => {
    const response = await fetch("https://lite.sushiswap.fi/tokens.json");
    const json = await response.json();
    const tokens = [...json.tokens, ...(customTokens || [])];

    const balances = await fetchTokenBalances(
        account,
        tokens.map(token => token.address)
    );
    return [
        {
            ...ETH,
            balance: await ALCHEMY_PROVIDER.getBalance(account)
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

// tslint:disable-next-line:max-func-body-length
export const fetchPools = async (account: string, tokens: Token[], provider: ethers.providers.JsonRpcProvider) => {
    const info = await sushiData.sushi.info();
    const masterchefInfo = await sushiData.masterchef.info();
    const pools = await sushiData.masterchef.pools();
    const balances = await fetchTokenBalances(
        account,
        pools.map(pool => pool.lpToken)
    );
    // tslint:disable-next-line:max-func-body-length
    const fetchPool = async (pool, i): Promise<LPToken | null> => {
        try {
            const result = await Promise.all([
                fetchStakedValue(pool.lpToken),
                fetchPairTokens(pool.lpToken, tokens, provider)
            ]);
            if (result[0].length === 0) return null;
            const apy = calcAPY(
                info[0].derivedETH,
                pool.allocPoint,
                masterchefInfo[0].totalAllocPoint,
                result[0][0].totalValueETH
            );
            if (apy === 0) return null;
            return {
                ...pool,
                apy,
                address: pool.lpToken,
                decimals: 18,
                tokenA: result[1].tokenA,
                tokenB: result[1].tokenB,
                symbol: result[1].tokenA.symbol + "-" + result[1].tokenB.symbol + " LP",
                balance: ethers.BigNumber.from(balances[i] || 0),
                sushiRewardedPerYear: calcSushiRewardedPerYear(
                    pool.allocPoint,
                    masterchefInfo[0].totalAllocPoint,
                    result[0][0].totalSupply
                ),
                totalSupply: parseBalance(String(result[0][0].totalSupply), 18),
                totalValueUSD: result[0][0].totalValueUSD
            };
        } catch (e) {
            return null;
        }
    };
    return (await Promise.all(pools.map(fetchPool))).filter(pool => !!pool) as LPToken[];
};

export const fetchMyPools = async (account: string, tokens: Token[], provider: ethers.providers.JsonRpcProvider) => {
    const pools = await sushiData.masterchef.pools();
    const fetchMyPool = async (pool): Promise<LPToken | null> => {
        try {
            const myStake = await fetchMyStake(pool.id, account, provider);
            if (myStake.amountDeposited.isZero()) return null;
            const result = await Promise.all([
                fetchStakedValue(pool.lpToken),
                fetchPairTokens(pool.lpToken, tokens, provider)
            ]);
            return {
                ...pool,
                address: pool.lpToken,
                decimals: 18,
                tokenA: result[1].tokenA,
                tokenB: result[1].tokenB,
                symbol: result[1].tokenA.symbol + "-" + result[1].tokenB.symbol + " LP",
                balance: ethers.constants.Zero,
                amountDeposited: myStake.amountDeposited,
                pendingSushi: myStake.pendingSushi,
                totalSupply: parseBalance(String(result[0][0].totalSupply), 18)
            };
        } catch (e) {
            return null;
        }
    };
    return (await Promise.all(pools.map(fetchMyPool))).filter(pool => !!pool) as LPToken[];
};

const calcAPY = (derivedETH, allocPoint, totalAllocPoint, totalValueETH) => {
    return (derivedETH * blocksPerDay * sushiPerBlock * 3 * 365 * (allocPoint / totalAllocPoint)) / totalValueETH;
};

const calcSushiRewardedPerYear = (allocPoint, totalAllocPoint, totalSupply) => {
    return ethers.BigNumber.from(blocksPerDay * sushiPerBlock * 3 * 365 * allocPoint)
        .mul(pow10(36))
        .div(totalAllocPoint)
        .div(parseBalance(String(totalSupply)));
};

const fetchStakedValue = async (lpToken: string) => {
    return await sushiData.masterchef.stakedValue({ lpToken });
};

const fetchMyStake = async (poolId: number, account: string, provider: ethers.providers.JsonRpcProvider) => {
    const masterChef = getContract("MasterChef", MASTER_CHEF, provider);
    const { amount: amountDeposited } = await masterChef.userInfo(poolId, account);
    const pendingSushi = await masterChef.pendingSushi(poolId, account);
    return { amountDeposited, pendingSushi };
};

const fetchPairTokens = async (lpToken: string, tokens: Token[], provider: ethers.providers.JsonRpcProvider) => {
    const contract = getContract("IUniswapV2Pair", lpToken, provider);
    const tokenA = await findOrFetchToken(await contract.token0(), provider, tokens);
    const tokenB = await findOrFetchToken(await contract.token1(), provider, tokens);
    return { tokenA, tokenB };
};

export const fetchMyLPTokens = async (account: string, tokens: Token[], provider: ethers.providers.JsonRpcProvider) => {
    return await fetchLPTokens(SUSHISWAP_FACTORY, account, tokens, provider);
};

export const fetchMyUniswapLPTokens = async (
    account: string,
    tokens: Token[],
    provider: ethers.providers.JsonRpcProvider
) => {
    return await fetchLPTokens(UNISWAP_FACTORY, account, tokens, provider);
};

const LP_TOKENS_LIMIT = 100;

// tslint:disable-next-line:max-func-body-length
const fetchLPTokens = async (
    factory: string,
    account: string,
    tokens: Token[],
    provider: ethers.providers.JsonRpcProvider
) => {
    const factoryContract = getContract("IUniswapV2Factory", factory, provider);
    const length = await factoryContract.allPairsLength();
    const scanner = getContract("LPTokenScanner", LP_TOKEN_SCANNER, provider);
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
        account,
        pairs.map(pair => pair.token)
    );
    return await Promise.all(
        pairs.map(async (pair, index) => {
            const address = pair.token;
            const balance = ethers.BigNumber.from(balances[index]);
            const contract = getContract("IUniswapV2Pair", address, provider);
            const erc20 = getContract("ERC20", address, provider);
            const decimals = Number(await erc20.decimals());
            const totalSupply = await erc20.totalSupply();
            const tokenA = await findOrFetchToken(await contract.token0(), provider, tokens);
            const tokenB = await findOrFetchToken(await contract.token1(), provider, tokens);
            const name = tokenA.symbol + "-" + tokenB.symbol + " LP Token";
            const symbol = tokenA.symbol + "-" + tokenB.symbol;
            return { address, decimals, name, symbol, balance, totalSupply, tokenA, tokenB } as LPToken;
        })
    );
};

export const findOrFetchToken = async (
    address: string,
    provider: ethers.providers.JsonRpcProvider,
    tokens?: Token[]
) => {
    if (tokens) {
        const token = tokens.find(t => t.address.toLowerCase() === address.toLowerCase());
        if (token) {
            return token;
        }
    }
    let meta = await ALCHEMY_PROVIDER.send("alchemy_getTokenMetadata", [address]);
    if (!meta.name || meta.symbol || meta.decimals || meta.logoURI) {
        meta = await fetchTokenMeta(address, provider);
    }
    return {
        address,
        name: meta.name,
        symbol: meta.symbol,
        decimals: meta.decimals,
        logoURI: meta.logo,
        balance: ethers.constants.Zero
    } as Token;
};

const fetchTokenMeta = async (address: string, provider: ethers.providers.JsonRpcProvider) => {
    const erc20 = getContract("ERC20", address, provider);
    const data = await Promise.all(
        ["name", "symbol", "decimals"].map(field => {
            try {
                return erc20.callStatic[field]();
            } catch (e) {
                return "";
            }
        })
    );
    return {
        name: data[0],
        symbol: data[1],
        decimals: data[2],
        logoURI: ""
    };
};

const fetchTokenBalances = async (account: string, addresses: string[]) => {
    const balances = await ALCHEMY_PROVIDER.send("alchemy_getTokenBalances", [account, addresses]);
    return balances.tokenBalances.map(balance => balance.tokenBalance);
};

const LIMIT_ORDERS_LIMIT = 20;

export const fetchMyLimitOrders = async (
    provider: ethers.providers.JsonRpcProvider,
    signer: ethers.Signer,
    kovanSigner: ethers.Signer,
    tokens?: Token[],
    canceledHashes?: string[]
) => {
    const orderBook = getContract("OrderBook", ORDER_BOOK, kovanSigner);
    const settlement = await getContract("Settlement", SETTLEMENT, provider);
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
                await findOrFetchToken(args.fromToken, provider, tokens),
                await findOrFetchToken(args.toToken, provider, tokens),
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

export const fetchMyCanceledLimitOrderHashes = async (signer: ethers.providers.JsonRpcSigner) => {
    const settlement = await getContract("Settlement", SETTLEMENT, signer);
    const length = await settlement.numberOfCanceledHashesOfMaker(await signer.getAddress());
    const pages: number[] = [];
    for (let i = 0; i * LIMIT_ORDERS_LIMIT < length; i++) pages.push(i);
    return (await Promise.all(pages.map(page => settlement.allCanceledHashes(page, LIMIT_ORDERS_LIMIT))))
        .flat()
        .filter(hash => hash !== ethers.constants.HashZero);
};
