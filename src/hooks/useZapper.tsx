import { useCallback, useContext } from "react";

import { Percent, Router, TokenAmount } from "@sushiswap/sdk";
import { signERC2612Permit } from "eth-permit";
import { ethers } from "ethers";
import { ROUTER, ZAP_IN, ZAP_OUT } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import Token from "../types/Token";
import { convertToken, deduct, getContract, isETH, parseCurrencyAmount } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import useSDK from "./useSDK";
import useSwapRouter from "./useSwapRouter";

// tslint:disable-next-line:max-func-body-length
const useZapper = () => {
    const { ethereum } = useContext(EthersContext);
    const { getPair, getTrade, calculateAmountOfLPTokenMinted } = useSDK();
    const { allowedSlippage, ttl } = useSwapRouter();
    const zapSlippage = new Percent("3", "100"); // 3.0%

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
                deduct(lpTokenAmount, zapSlippage),
                ROUTER,
                ROUTER,
                await populateSwapData(fromToken, toToken, fromAmount.div(2), provider, signer)
            ];
            const value = isETH(fromToken) ? fromAmount : ethers.constants.Zero;
            const gasLimit = await contract.estimateGas.ZapIn(...args, { value });
            const tx = await contract.ZapIn(...args, {
                value,
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "ZapIn_General_V2.ZapIn()", ...args.map(arg => arg.toString()));
        },
        [populateSwapData]
    );

    const getZapOutSwappedAmount = async (
        outputToken: Token,
        lpToken: LPToken,
        lpTokenAmount: ethers.BigNumber,
        provider: ethers.providers.BaseProvider
    ) => {
        let fromToken: Token;
        let toToken: Token;
        if (outputToken === lpToken.tokenA) {
            fromToken = lpToken.tokenB;
            toToken = lpToken.tokenA;
        } else if (outputToken === lpToken.tokenB) {
            fromToken = lpToken.tokenA;
            toToken = lpToken.tokenB;
        } else {
            throw new Error("Wrong outputToken");
        }
        const pair = await getPair(fromToken, toToken, provider);
        const fromReserve = parseCurrencyAmount(pair.reserveOf(convertToken(fromToken)), fromToken.decimals);
        const fromAmount = lpTokenAmount.mul(fromReserve).div(lpToken.totalSupply);
        const trade = await getTrade(fromToken, toToken, fromAmount, provider);
        if (!trade) throw new Error("Cannot find trade");
        return parseCurrencyAmount(trade.outputAmount);
    };

    const zapOut = useCallback(
        // tslint:disable-next-line:max-func-body-length
        async (
            lpToken: LPToken,
            outputToken: Token,
            amount: ethers.BigNumber,
            provider: ethers.providers.BaseProvider,
            signer: ethers.Signer
        ) => {
            const contract = getContract("ZapOut", ZAP_OUT, signer);
            const deadline = Math.floor(new Date().getTime() / 1000) + ttl;
            const permit = await signERC2612Permit(
                ethereum,
                lpToken.address,
                await signer.getAddress(),
                ZAP_OUT,
                amount.toString(),
                deadline
            );
            const args = [
                outputToken.address,
                lpToken.address,
                amount,
                deduct(await getZapOutSwappedAmount(outputToken, lpToken, amount, provider), zapSlippage),
                amount,
                deadline,
                permit.v,
                permit.r,
                permit.s
            ];
            const gasLimit = await contract.estimateGas.ZapOutWithPermit(...args);
            const tx = await contract.ZapOutWithPermit(...args, {
                gasLimit: gasLimit.mul(120).div(100)
            });
            return logTransaction(tx, "ZapOut_General_V1.ZapOutWithPermit()", ...args.map(arg => arg.toString()));
        },
        [getZapOutSwappedAmount]
    );

    return {
        zapIn,
        zapOut,
        getZapOutSwappedAmount
    };
};

export default useZapper;
