import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { parseBalance } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSDK, { MASTER_CHEF } from "./useSDK";

export interface FarmingState extends LPTokensState {
    expectedSushiRewardPerBlock?: ethers.BigNumber;
    onDeposit: () => Promise<void>;
    depositing: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useFarmingState: () => FarmingState = () => {
    const state = useLPTokensState(true);
    const { provider, signer, getTokenAllowance } = useContext(EthersContext);
    const { getExpectedSushiRewardPerBlock, deposit } = useSDK();
    const [loading, setLoading] = useState(false);
    const [expectedSushiRewardPerBlock, setExpectedSushiRewardPerBlock] = useState<ethers.BigNumber>();
    const [depositing, setDepositing] = useState(false);

    useEffect(() => {
        setExpectedSushiRewardPerBlock(undefined);
    }, [state.selectedLPToken]);

    useAsyncEffect(async () => {
        if (signer && state.selectedLPToken) {
            setLoading(true);
            try {
                setExpectedSushiRewardPerBlock(await getExpectedSushiRewardPerBlock(state.selectedLPToken));
            } finally {
                setLoading(false);
            }
        }
    }, [signer, state.selectedLPToken]);

    useAsyncEffect(async () => {
        if (provider && signer && state.selectedLPToken) {
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
    }, [provider, signer, state.selectedLPToken]);

    const onDeposit = useCallback(async () => {
        if (state.selectedLPToken?.id && state.amount && signer) {
            setDepositing(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await deposit(state.selectedLPToken.id, amount);
                await tx.wait();
                state.setSelectedLPToken(undefined);
            } finally {
                setDepositing(false);
            }
        }
    }, [state.selectedLPToken, state.amount, signer]);

    return {
        ...state,
        loading: state.loading || loading,
        expectedSushiRewardPerBlock,
        onDeposit,
        depositing
    };
};

export default useFarmingState;
