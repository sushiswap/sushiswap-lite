import { useCallback, useContext, useEffect, useState } from "react";

import { TokenAmount } from "@sushiswap/sdk";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { MASTER_CHEF } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { convertToken, parseBalance } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useMasterChef from "./useMasterChef";

export interface FarmingState extends LPTokensState {
    onDeposit: () => Promise<void>;
    depositing: boolean;
    onWithdraw: () => Promise<void>;
    withdrawing: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useFarmingState: (myPools: boolean) => FarmingState = myPools => {
    const state = useLPTokensState(myPools ? "my-pools" : "pools");
    const { signer, getTokenAllowance } = useContext(EthersContext);
    const { deposit, withdraw } = useMasterChef();
    const [loading, setLoading] = useState(false);
    const [depositing, setDepositing] = useState(false);
    const [withdrawing, setWithdrawing] = useState(false);

    useEffect(() => {
        setLoading(false);
        setDepositing(false);
        setWithdrawing(false);
        state.setFromAmount("");
        state.setToAmount("");
    }, [state.selectedLPToken]);

    useAsyncEffect(async () => {
        if (signer && state.selectedLPToken) {
            setLoading(true);
            state.setSelectedLPTokenAllowed(false);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const allowance = await getTokenAllowance(state.selectedLPToken.address, MASTER_CHEF);
                state.setSelectedLPTokenAllowed(ethers.BigNumber.from(allowance).gte(minAllowance));
            } finally {
                setLoading(false);
            }
        }
    }, [signer, state.selectedLPToken]);

    useAsyncEffect(() => {
        if (
            state.pair &&
            state.selectedLPToken &&
            state.selectedLPToken.totalSupply &&
            state.selectedLPToken.amountDeposited
        ) {
            const lpToken = convertToken(state.selectedLPToken);
            const tokenA = convertToken(state.selectedLPToken.tokenA);
            const tokenB = convertToken(state.selectedLPToken.tokenB);
            const totalSupply = new TokenAmount(lpToken, state.selectedLPToken.totalSupply.toString());
            const lpTokenAmount = new TokenAmount(lpToken, state.selectedLPToken.amountDeposited.toString());
            const tokenAAmount = state.pair.involvesToken(tokenA)
                ? state.pair.getLiquidityValue(tokenA, totalSupply, lpTokenAmount)
                : null;
            state.setFromAmount(tokenAAmount?.toFixed() || "");
            const tokenBAmount = state.pair.involvesToken(tokenA)
                ? state.pair.getLiquidityValue(tokenB, totalSupply, lpTokenAmount)
                : null;
            state.setToAmount(tokenBAmount?.toFixed() || "");
        }
    }, [state.pair, state.selectedLPToken]);

    const onDeposit = useCallback(async () => {
        if (state.selectedLPToken?.id && state.amount && signer) {
            setDepositing(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await deposit(state.selectedLPToken.id, amount, signer);
                await tx.wait();
                state.setSelectedLPToken(undefined);
                await state.updateLastTimeRefreshed();
            } finally {
                setDepositing(false);
            }
        }
    }, [state.selectedLPToken, state.amount, signer]);

    const onWithdraw = useCallback(async () => {
        if (state.selectedLPToken?.id && state.amount && signer) {
            setWithdrawing(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await withdraw(state.selectedLPToken.id, amount, signer);
                await tx.wait();
                state.setSelectedLPToken(undefined);
                await state.updateLastTimeRefreshed();
            } finally {
                setWithdrawing(false);
            }
        }
    }, [state.selectedLPToken, state.amount, signer]);

    return {
        ...state,
        loading: state.loading || loading,
        onDeposit,
        depositing,
        onWithdraw,
        withdrawing
    };
};

export default useFarmingState;
