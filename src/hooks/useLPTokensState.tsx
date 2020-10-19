import { useContext, useEffect, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import { fetchMyLPTokens, fetchMyUniswapLPTokens, fetchPools } from "../utils/fetch-utils";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";

export interface LPTokensState extends LiquidityState {
    updateLPTokens: () => Promise<void>;
    lastTimeRefreshed: number;
    updateLastTimeRefreshed: () => void;
    lpTokens: LPToken[];
    selectedLPToken?: LPToken;
    setSelectedLPToken: (token?: LPToken) => void;
    selectedLPTokenAllowed: boolean;
    setSelectedLPTokenAllowed: (allowed: boolean) => void;
    amount: string;
    setAmount: (amount: string) => void;
}

type Mode = "pools" | "my-lp-tokens" | "my-uniswap-lp-tokens";

// tslint:disable-next-line:max-func-body-length
const useLPTokensState: (mode: Mode) => LPTokensState = mode => {
    const state = useLiquidityState();
    const { provider, signer, address, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [amount, setAmount] = useState("");

    const updateLPTokens = async () => {
        try {
            const data = await (mode === "pools"
                ? fetchPools(provider, signer)
                : mode === "my-lp-tokens"
                ? fetchMyLPTokens(tokens, provider, signer)
                : fetchMyUniswapLPTokens(tokens, provider, signer));
            if (data) {
                setLPTokens(data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedLPToken) {
            setAmount("");
        }
    }, [selectedLPToken]);

    useDelayedOnBlockEffect(
        async block => {
            if (provider && signer && (mode === "pools" || tokens.length > 0)) {
                if (!block) {
                    setLoading(true);
                }
                await updateLPTokens();
            }
        },
        () => "updateLPTokens()",
        [provider, signer, tokens.length, address, lastTimeRefreshed],
        0
    );

    return {
        ...state,
        updateLPTokens,
        loading: state.loading || loading,
        lastTimeRefreshed,
        updateLastTimeRefreshed: () => {
            setLastTimeRefreshed(Date.now());
        },
        lpTokens,
        selectedLPToken,
        setSelectedLPToken,
        selectedLPTokenAllowed,
        setSelectedLPTokenAllowed,
        amount,
        setAmount
    };
};

export default useLPTokensState;
