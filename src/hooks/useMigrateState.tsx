import { useCallback, useContext, useState } from "react";

import { Fetcher } from "@sushiswap/sdk";
import { EthersContext } from "../context/EthersContext";
import { convertToken, parseBalance } from "../utils";
import useLPTokensState, { LPTokensState } from "./useLPTokensState";
import useSDK from "./useSDK";

export interface MigrateState extends LPTokensState {
    onMigrate: () => Promise<void>;
    migrating: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useMigrateState: () => MigrateState = () => {
    const state = useLPTokensState("my-uniswap-lp-tokens");
    const { provider, signer, updateTokens } = useContext(EthersContext);
    const { migrate } = useSDK();
    const [migrating, setMigrating] = useState(false);

    const onMigrate = useCallback(async () => {
        if (state.selectedLPToken && state.amount && provider && signer) {
            setMigrating(true);
            try {
                const pair = await Fetcher.fetchPairData(
                    convertToken(state.selectedLPToken.tokenA),
                    convertToken(state.selectedLPToken.tokenB),
                    provider
                );

                const amount = parseBalance(state.amount, state.selectedLPToken.decimals);
                const tx = await migrate(state.selectedLPToken, amount, signer);
                await tx.wait();
                await updateTokens();
                await state.updateLPTokens();
                state.setSelectedLPToken(undefined);

                window.open("https://sushiswap.fi/pair/" + pair.liquidityToken.address, "_blank");
            } finally {
                setMigrating(false);
            }
        }
    }, [state.selectedLPToken, state.amount, provider, signer, migrate, updateTokens]);

    return {
        ...state,
        onMigrate,
        migrating
    };
};

export default useMigrateState;
