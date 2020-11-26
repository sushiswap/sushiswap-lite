import { useContext, useEffect, useState } from "react";

import { Pair } from "@sushiswap/sdk";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import LPToken from "../types/LPToken";
import { fetchMyLPTokens, fetchMyPools, fetchMyUniswapLPTokens, fetchPools } from "../utils/fetch-utils";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface LPTokensState extends TokenPairState {
    updateLPTokens: () => Promise<void>;
    lastTimeRefreshed: number;
    updateLastTimeRefreshed: () => void;
    lpTokens: LPToken[];
    selectedLPToken?: LPToken;
    setSelectedLPToken: (token?: LPToken) => void;
    selectedLPTokenAllowed: boolean;
    setSelectedLPTokenAllowed: (allowed: boolean) => void;
    pair?: Pair;
    amount: string;
    setAmount: (amount: string) => void;
}

type Mode = "pools" | "my-pools" | "my-lp-tokens" | "my-uniswap-lp-tokens";

let updatingLPTokens = false;

// tslint:disable-next-line:max-func-body-length
const useLPTokensState: (mode: Mode) => LPTokensState = mode => {
    const state = useTokenPairState();
    const { provider, address, tokens } = useContext(EthersContext);
    const [lastTimeRefreshed, setLastTimeRefreshed] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lpTokens, setLPTokens] = useState<LPToken[]>([]);
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();
    const [selectedLPTokenAllowed, setSelectedLPTokenAllowed] = useState(false);
    const [pair, setPair] = useState<Pair>();
    const [amount, setAmount] = useState("");
    const { getPair } = useSDK();

    const updateLPTokens = async () => {
        if (address && provider && tokens.length > 0 && !updatingLPTokens) {
            try {
                updatingLPTokens = true;
                const data = await (mode === "my-pools"
                    ? fetchMyPools(address, tokens, provider)
                    : mode === "pools"
                    ? fetchPools(address, tokens, provider)
                    : mode === "my-lp-tokens"
                    ? fetchMyLPTokens(address, tokens, provider)
                    : fetchMyUniswapLPTokens(address, tokens, provider));
                if (data) {
                    setLPTokens(data);
                }
            } finally {
                updatingLPTokens = false;
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (!selectedLPToken) {
            setAmount("");
        }
    }, [selectedLPToken]);

    useAsyncEffect(async () => {
        setLoading(true);
        setPair(undefined);
        if (selectedLPToken && provider) {
            try {
                setPair(await getPair(selectedLPToken.tokenA, selectedLPToken.tokenB, provider));
            } catch (e) {
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [selectedLPToken, provider]);

    useDelayedOnBlockEffect(
        async block => {
            if (address && (mode === "pools" || tokens.length > 0)) {
                if (!block) {
                    setLoading(true);
                }
                await updateLPTokens();
            }
        },
        () => "updateLPTokens()",
        [tokens.length, address, lastTimeRefreshed],
        0
    );

    return {
        ...state,
        fromToken: state.fromToken || selectedLPToken?.tokenA,
        toToken: state.toToken || selectedLPToken?.tokenB,
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
        pair,
        amount,
        setAmount
    };
};

export default useLPTokensState;
