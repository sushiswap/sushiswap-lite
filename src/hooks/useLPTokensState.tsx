import { useContext, useEffect, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import { fetchMyLPTokens, fetchPools } from "../utils/fetch-utils";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";

export interface LPTokensState extends LiquidityState {
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

// tslint:disable-next-line:max-func-body-length
const useLPTokensState: (loadPools: boolean) => LPTokensState = loadPools => {
    const state = useLiquidityState();
    const { provider, signer, address, addOnBlockListener, removeOnBlockListener, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [amount, setAmount] = useState("");

    const updateLPTokens = async () => {
        try {
            const data = await (loadPools ? fetchPools(provider, signer) : fetchMyLPTokens(tokens, provider, signer));
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

    useEffect(() => {
        if (provider && signer && (loadPools || tokens.length > 0)) {
            setLoading(true);
            updateLPTokens();

            const name = "updateLPTokens()";
            addOnBlockListener(name, updateLPTokens);
            return () => {
                removeOnBlockListener(name);
            };
        }
    }, [provider, signer, tokens.length, address, lastTimeRefreshed]);

    return {
        ...state,
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
