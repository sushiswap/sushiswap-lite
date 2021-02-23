import { useCallback } from "react";

import { Currency, CurrencyAmount, Pair, TokenAmount, Trade } from "@sushiswap/sdk";
import { ethers } from "ethers";
import Token from "../types/Token";
import { convertToken, isETH } from "../utils";
import useAllCommonPairs from "./useAllCommonPairs";
import useERC20 from "./useERC20";

// tslint:disable-next-line:max-func-body-length
const useSDK = () => {
    const { getTotalSupply } = useERC20();
    const { loadAllCommonPairs } = useAllCommonPairs();

    const getTrade = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            fromAmount: ethers.BigNumber,
            provider: ethers.providers.BaseProvider
        ) => {
            const eth = isETH(fromToken);
            const from = convertToken(fromToken);
            const to = isETH(toToken) ? Currency.ETHER : convertToken(toToken);
            const pairs = await loadAllCommonPairs(from, to, provider);
            const amount = eth
                ? CurrencyAmount.ether(fromAmount.toString())
                : new TokenAmount(from, fromAmount.toString());
            return Trade.bestTradeExactIn(pairs, amount, to, { maxHops: 3, maxNumResults: 1 })[0];
        },
        []
    );

    const calculateAmountOfLPTokenMinted = async (pair: Pair, fromAmount: TokenAmount, toAmount: TokenAmount) => {
        const totalSupply = await getTotalSupply(pair.liquidityToken.address);
        if (totalSupply) {
            const minted = pair.getLiquidityMinted(
                new TokenAmount(pair.liquidityToken, totalSupply.toString()),
                fromAmount,
                toAmount
            );
            return ethers.BigNumber.from(minted.raw.toString());
        }
    };

    return {
        getTrade,
        calculateAmountOfLPTokenMinted
    };
};

export default useSDK;
