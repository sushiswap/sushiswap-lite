import { useCallback } from "react";

import { Percent, Router, TokenAmount } from "@sushiswap/sdk";
import { ethers } from "ethers";
import { ROUTER, ZAP_IN } from "../constants/contracts";
import Token from "../types/Token";
import { convertToken, deduct, getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import useSDK from "./useSDK";
import useSwapRouter from "./useSwapRouter";

// tslint:disable-next-line:max-func-body-length
const useZapper = () => {
    const { getPair, getTrade, calculateAmountOfLPTokenMinted } = useSDK();
    const { allowedSlippage, ttl } = useSwapRouter();
    const liquiditySlippage = new Percent("3", "100"); // 3.0%

    const populateSwapData = async (
        fromToken: Token,
        toToken: Token,
        amount: ethers.BigNumber,
        provider: ethers.providers.BaseProvider,
        signer: ethers.Signer
    ) => {
        const trade = await getTrade(fromToken, toToken, amount, provider);
        if (!trade) throw new Error("Cannot find trade");
        const params = Router.swapCallParameters(trade, {
            feeOnTransfer: false,
            allowedSlippage,
            recipient: ZAP_IN,
            ttl
        });
        const router = getContract("IUniswapV2Router02", ROUTER, signer);
        const tx = await router.populateTransaction[params.methodName](...params.args, { value: params.value });
        return tx.data || "";
    };

    const zapIn = useCallback(
        async (
            fromToken: Token,
            toToken: Token,
            fromAmount: ethers.BigNumber,
            provider: ethers.providers.BaseProvider,
            signer: ethers.Signer
        ) => {
            const pair = await getPair(fromToken, toToken, provider);
            const amount = new TokenAmount(convertToken(fromToken), fromAmount.div(2).toString());
            const lpTokenAmount = await calculateAmountOfLPTokenMinted(pair, amount, pair.getOutputAmount(amount)[0]);
            if (!lpTokenAmount) throw new Error("Cannot calculate LP token amount");
            const contract = getContract("ZapIn", ZAP_IN, signer);
            const args = [
                fromToken.address,
                pair.liquidityToken.address,
                fromAmount,
                deduct(lpTokenAmount, liquiditySlippage),
                ROUTER,
                ROUTER,
                await populateSwapData(fromToken, toToken, fromAmount.div(2), provider, signer)
            ];
            const value = fromToken.symbol === "ETH" ? fromAmount : ethers.constants.Zero;
            const gasLimit = await contract.estimateGas.ZapIn(...args, { value });
            const tx = await contract.ZapIn(...args, {
                value,
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "Sushiswap_ZapIn_General_V1.ZapIn()", ...args.map(arg => arg.toString()));
        },
        []
    );

    return {
        zapIn
    };
};

export default useZapper;
