import { useContext, useEffect, useState } from "react";

import { Pair } from "@sushiswap/sdk";
import sushiData from "@sushiswap/sushi-data";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { ETH } from "../constants/tokens";
import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import LPTokenWithValue from "../types/LPTokenWithValue";
import Token from "../types/Token";
import TokenWithValue from "../types/TokenWithValue";
import { convertToken, formatBalance, parseBalance, parseCurrencyAmount, pow10 } from "../utils";
import { fetchMyLPTokens, fetchMyPools } from "../utils/fetch-utils";
import useSDK from "./useSDK";

export interface HomeState {
    loadingTokens: boolean;
    loadingLPTokens: boolean;
    loadingPools: boolean;
    tokens?: TokenWithValue[];
    lpTokens?: LPTokenWithValue[];
    pools?: LPTokenWithValue[];
}

const CACHE: TokenWithValue[] = [];

// tslint:disable-next-line:max-func-body-length
const useHomeState = () => {
    const { provider, signer, address, loadingTokens, tokens: list } = useContext(EthersContext);
    const [tokens, setTokens] = useState<TokenWithValue[]>();
    const [lpTokens, setLPTokens] = useState<LPTokenWithValue[]>();
    const [pools, setPools] = useState<LPTokenWithValue[]>();
    const [loading, setLoading] = useState(true);
    const [loadingLPTokens, setLoadingLPTokens] = useState(true);
    const [loadingPools, setLoadingPools] = useState(true);
    const { getPair } = useSDK();

    useEffect(() => {
        setTokens(undefined);
        setLPTokens(undefined);
        setPools(undefined);
        setLoading(true);
        setLoadingLPTokens(true);
        setLoadingPools(true);
    }, [address]);

    // Load Tokens
    useAsyncEffect(async () => {
        const weth = list.find(t => t.symbol === "WETH");
        if (provider && weth && list.length > 0) {
            setLoading(true);
            CACHE.splice(0, CACHE.length);
            try {
                const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
                setTokens(
                    await Promise.all(
                        list.map(async token => await fetchTokenWithValue(token, weth, wethPriceUSD, getPair, provider))
                    )
                );
            } finally {
                setLoading(false);
            }
        }
    }, [getPair, provider, list, fetchTokenWithValue]);

    // Load Liquidity
    useAsyncEffect(async () => {
        const weth = list.find(t => t.symbol === "WETH");
        if (provider && signer && weth && tokens && tokens.length > 0) {
            setLoadingLPTokens(true);
            const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
            const fetched = await fetchMyLPTokens(await signer.getAddress(), tokens, provider);
            try {
                setLPTokens(
                    await Promise.all(
                        fetched.map(lpToken => fetchLPTokenWithValue(lpToken, weth, wethPriceUSD, getPair, provider))
                    )
                );
            } finally {
                setLoadingLPTokens(false);
            }
        }
    }, [getPair, provider, signer, tokens]);

    // Load Farming
    useAsyncEffect(async () => {
        const weth = list.find(t => t.symbol === "WETH");
        if (provider && signer && weth && tokens && tokens.length > 0) {
            setLoadingPools(true);
            const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
            const fetched = await fetchMyPools(await signer.getAddress(), tokens, provider);
            try {
                setPools(
                    await Promise.all(
                        fetched.map(lpToken => fetchLPTokenWithValue(lpToken, weth, wethPriceUSD, getPair, provider))
                    )
                );
            } finally {
                setLoadingPools(false);
            }
        }
    }, [getPair, provider, signer, tokens]);

    return {
        loadingTokens: loading || loadingTokens,
        loadingLPTokens,
        loadingPools,
        tokens,
        lpTokens,
        pools
    };
};

const fetchTokenWithValue = async (token: Token, weth: Token, wethPriceUSD: Fraction, getPair, provider) => {
    const cached = CACHE.find(t => t.address === token.address);
    if (cached) return cached;
    let fetched: TokenWithValue;
    if (token.symbol === "ETH" || token.symbol === "WETH") {
        fetched = {
            ...token,
            priceUSD: Number(wethPriceUSD.toString()),
            valueUSD: Number(formatBalance(wethPriceUSD.apply(token.balance)))
        } as TokenWithValue;
    } else {
        try {
            const pair = await getPair(token, weth, provider);
            const priceETH = Fraction.convert(pair.priceOf(convertToken(token)));
            const priceUSD = priceETH.apply(wethPriceUSD.numerator).div(pow10(18 - token.decimals));
            fetched = {
                ...token,
                priceUSD: Number(formatBalance(priceUSD)),
                valueUSD: Number(formatBalance(priceUSD.mul(token.balance).div(pow10(token.decimals))))
            } as TokenWithValue;
        } catch (e) {
            fetched = { ...token, priceUSD: null, valueUSD: null } as TokenWithValue;
        }
    }
    CACHE.push(fetched);
    return fetched;
};

const fetchLPTokenWithValue = async (lpToken: LPToken, weth: Token, wethPriceUSD: Fraction, getPair, provider) => {
    const pair = await getPair(lpToken.tokenA, lpToken.tokenB, provider);
    const values = await Promise.all([
        await fetchTotalValue(lpToken.tokenA, pair, weth, wethPriceUSD, getPair, provider),
        await fetchTotalValue(lpToken.tokenB, pair, weth, wethPriceUSD, getPair, provider)
    ]);
    const priceUSD = values[0]
        .add(values[1])
        .mul(pow10(18))
        .div(lpToken.totalSupply);
    return {
        ...lpToken,
        priceUSD: Number(formatBalance(priceUSD)),
        valueUSD: Number(
            formatBalance(priceUSD.mul(lpToken.amountDeposited || lpToken.balance).div(pow10(lpToken.decimals)))
        )
    };
};

const fetchTotalValue = async (token: Token, lpPair: Pair, weth: Token, wethPriceUSD: Fraction, getPair, provider) => {
    const tokenWithValue = await fetchTokenWithValue(token, weth, wethPriceUSD, getPair, provider);
    const tokenReserve = parseCurrencyAmount(lpPair.reserveOf(convertToken(token)), token.decimals);
    const tokenPrice = parseBalance(String(tokenWithValue.priceUSD || 0));
    return tokenReserve.mul(tokenPrice).div(pow10(token.decimals));
};

export default useHomeState;
