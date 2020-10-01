import { useCallback, useContext, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { MIGRATOR2 } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { parseBalance } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSDK from "./useSDK";

export interface MigrateState extends LPTokensState {
    onMigrate: () => Promise<void>;
    migrating: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMigrateState: () => MigrateState = () => {
    const state = useLPTokensState("my-uniswap-lp-tokens");
    const { provider, signer, getTokenAllowance, updateTokens } = useContext(EthersContext);
    const { migrate } = useSDK();
    const [loading, setLoading] = useState(false);
    const [migrating, setMigrating] = useState(false);

    useAsyncEffect(async () => {
        if (provider && signer && state.selectedLPToken) {
            setLoading(true);
            state.setSelectedLPTokenAllowed(false);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const allowance = await getTokenAllowance(state.selectedLPToken.address, MIGRATOR2);
                state.setSelectedLPTokenAllowed(ethers.BigNumber.from(allowance).gte(minAllowance));
            } finally {
                setLoading(false);
            }
        }
    }, [provider, signer, state.selectedLPToken]);

    const onMigrate = useCallback(async () => {
        if (state.selectedLPToken && state.amount && signer) {
            setMigrating(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await migrate(state.selectedLPToken, amount);
                await tx.wait();
                await updateTokens();
                state.setSelectedLPToken(undefined);
            } finally {
                setMigrating(false);
            }
        }
    }, [state.selectedLPToken, state.amount, signer, updateTokens]);

    return {
        ...state,
        loading: state.loading || loading,
        onMigrate,
        migrating
    };
};

export default useMigrateState;
