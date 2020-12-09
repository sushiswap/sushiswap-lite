import { useCallback } from "react";

import { ChainId, Currency, ETHER, Fetcher, Pair, Token, WETH } from "@sushiswap/sdk";
import { ethers } from "ethers";

const WBTC = new Token(ChainId.MAINNET, "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", 8, "WBTC", "Wrapped BTC");
const DAI = new Token(ChainId.MAINNET, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "DAI", "Dai Stablecoin");
const USDC = new Token(ChainId.MAINNET, "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", 6, "USDC", "USD//C");
const USDT = new Token(ChainId.MAINNET, "0xdAC17F958D2ee523a2206206994597C13D831ec7", 6, "USDT", "Tether USD");
const SUSHI = new Token(ChainId.MAINNET, "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", 18, "SUSHI", "SushiToken");
const YAM = new Token(ChainId.MAINNET, "0x0e2298E3B3390e3b945a5456fBf59eCc3f55DA16", 18, "YAM", "YAM");
const AMPL = new Token(ChainId.MAINNET, "0xD46bA6D942050d489DBd938a2C909A5d5039A161", 9, "AMPL", "Ampleforth");

const BASES_TO_CHECK_TRADES_AGAINST = [WETH[ChainId.MAINNET], WBTC, DAI, USDC, USDT, SUSHI, YAM];
const CUSTOM_BASES = {
    [AMPL.address]: [DAI, WETH[ChainId.MAINNET], WBTC]
};

function wrappedCurrency(currency: Currency | undefined): Token | undefined {
    return currency === ETHER ? WETH[ChainId.MAINNET] : currency instanceof Token ? currency : undefined;
}

// Source: https://github.com/Uniswap/uniswap-interface/blob/master/src/hooks/Trades.ts
const useAllCommonPairs = () => {
    const loadAllCommonPairs = useCallback(
        // tslint:disable-next-line:max-func-body-length
        async (currencyA?: Currency, currencyB?: Currency, provider?: ethers.providers.BaseProvider) => {
            const bases: Token[] = BASES_TO_CHECK_TRADES_AGAINST;
            const [tokenA, tokenB] = [wrappedCurrency(currencyA), wrappedCurrency(currencyB)];
            const basePairs: [Token, Token][] = bases
                .flatMap((base): [Token, Token][] => bases.map(otherBase => [base, otherBase]))
                .filter(([t0, t1]) => t0.address !== t1.address);

            const allPairCombinations =
                tokenA && tokenB
                    ? [
                          // the direct pair
                          [tokenA, tokenB],
                          // token A against all bases
                          ...bases.map((base): [Token, Token] => [tokenA, base]),
                          // token B against all bases
                          ...bases.map((base): [Token, Token] => [tokenB, base]),
                          // each base against all bases
                          ...basePairs
                      ]
                          .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
                          .filter(([t0, t1]) => t0.address !== t1.address)
                          .filter(([a, b]) => {
                              const customBases = CUSTOM_BASES;
                              if (!customBases) return true;

                              const customBasesA: Token[] | undefined = customBases[a.address];
                              const customBasesB: Token[] | undefined = customBases[b.address];

                              if (!customBasesA && !customBasesB) return true;

                              if (customBasesA && !customBasesA.find(base => tokenB.equals(base))) return false;
                              return !(customBasesB && !customBasesB.find(base => tokenA.equals(base)));
                          })
                    : [];

            const pairs = await Promise.all(
                allPairCombinations.map(async pair => {
                    try {
                        return await Fetcher.fetchPairData(pair[0], pair[1], provider);
                    } catch (e) {
                        return null;
                    }
                })
            );
            return pairs.filter(pair => pair !== null) as Pair[];
        },
        []
    );

    return { loadAllCommonPairs };
};

export default useAllCommonPairs;
