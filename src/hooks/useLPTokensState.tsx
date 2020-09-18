import { useContext, useEffect, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import LPToken from "../types/LPToken";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";
import useSDK from "./useSDK";

export interface LPTokensState extends LiquidityState {
    lpTokens: LPToken[];
    updateLPTokens: () => Promise<void>;
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
    const { provider, signer, address, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const { tokens } = useContext(GlobalContext);
    const { getMyLPTokens, getPools } = useSDK();
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [amount, setAmount] = useState("");

    const updateLPTokens = async () => {
        try {
            const method = loadPools ? getPools : getMyLPTokens;
            const data = await method();
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
            updateLPTokens();

            const name = "updateLPTokens()";
            addOnBlockListener(name, updateLPTokens);
            return () => {
                removeOnBlockListener(name);
            };
        }
    }, [provider, signer, tokens.length, address]);

    return {
        ...state,
        loading: state.loading || loading,
        lpTokens,
        updateLPTokens,
        selectedLPToken,
        setSelectedLPToken,
        selectedLPTokenAllowed,
        setSelectedLPTokenAllowed,
        amount,
        setAmount
    };
};

export default useLPTokensState;
