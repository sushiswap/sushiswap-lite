import { useCallback, useContext, useState } from "react";

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
    const { signer, updateTokens } = useContext(EthersContext);
    const { migrate } = useSDK();
    const [migrating, setMigrating] = useState(false);

    const onMigrate = useCallback(async () => {
        if (state.selectedLPToken && state.amount && signer) {
            setMigrating(true);
            try {
                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await migrate(state.selectedLPToken, amount, signer);
                await tx.wait();
                await updateTokens();
                await state.updateLPTokens();
                state.setSelectedLPToken(undefined);
            } finally {
                setMigrating(false);
            }
        }
    }, [state.selectedLPToken, state.amount, signer, migrate, updateTokens]);

    return {
        ...state,
        onMigrate,
        migrating
    };
};

export default useMigrateState;
