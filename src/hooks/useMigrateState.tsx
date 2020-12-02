import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { SUSHI_ROLL } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import { parseBalance } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSushiRoll from "./useSushiRoll";

export type MigrateMode = "permit" | "approve";

export interface MigrateState extends LPTokensState {
    mode?: MigrateMode;
    setMode: (_mode?: MigrateMode) => void;
    onMigrate: () => Promise<void>;
    migrating: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMigrateState: () => MigrateState = () => {
    const { ethereum } = useContext(EthersContext);
    const state = useLPTokensState("my-uniswap-lp-tokens");
    const { provider, signer, getTokenAllowance, updateTokens } = useContext(EthersContext);
    const { migrate, migrateWithPermit } = useSushiRoll();
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<MigrateMode>();
    const [migrating, setMigrating] = useState(false);

    useEffect(() => {
        if (ethereum?.isWalletConnect) {
            setMode("approve");
        } else {
            setMode(undefined);
        }
    }, [ethereum]);

    useEffect(() => {
        state.setSelectedLPToken();
    }, [mode]);

    useAsyncEffect(async () => {
        if (provider && signer && state.selectedLPToken) {
            setLoading(true);
            state.setSelectedLPTokenAllowed(false);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const allowance = await getTokenAllowance(state.selectedLPToken.address, SUSHI_ROLL);
                state.setSelectedLPTokenAllowed(ethers.BigNumber.from(allowance).gte(minAllowance));
            } finally {
                setLoading(false);
            }
        }
    }, [provider, signer, state.selectedLPToken]);

    const onMigrate = useCallback(async () => {
        if (mode && state.selectedLPToken && state.amount && provider && signer) {
            setMigrating(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const func = mode === "approve" ? migrate : migrateWithPermit;
                const tx = await func(state.selectedLPToken, amount, signer);
                await tx.wait();
                await updateTokens();
                await state.updateLPTokens();
                state.setSelectedLPToken(undefined);
            } finally {
                setMigrating(false);
            }
        }
    }, [mode, state.selectedLPToken, state.amount, provider, signer, migrateWithPermit, updateTokens]);

    return {
        ...state,
        loading: state.loading || loading,
        mode,
        setMode,
        onMigrate,
        migrating
    };
};

export default useMigrateState;
