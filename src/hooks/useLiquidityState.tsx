import { useContext, useEffect, useState } from "react";

import { Pair } from "@sushiswap/sdk";
import { EthersContext } from "../context/EthersContext";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface LiquidityState extends TokenPairState {
    pair?: Pair;
}

// tslint:disable-next-line:max-func-body-length
const useLiquidityState: () => LiquidityState = () => {
    const state = useTokenPairState();
    const { signer, addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const [pair, setPair] = useState<Pair>();
    const { getPair } = useSDK();

    useEffect(() => {
        if (state.fromSymbol && state.toSymbol) {
            const updatePair = async () => {
                if (state.fromToken && state.toToken && signer?.provider) {
                    try {
                        setPair(await getPair(state.fromToken, state.toToken, signer?.provider));
                    } catch (e) {
                    } finally {
                        setLoading(false);
                    }
                }
            };

            setLoading(true);
            updatePair();
            const name = "updatePair(" + state.fromSymbol + "," + state.toSymbol + ")";

            addOnBlockListener(name, updatePair);
            return () => {
                removeOnBlockListener(name);
            };
        }
    }, [state.fromSymbol, state.toSymbol]);

    return {
        ...state,
        loading: loading || state.loading,
        pair
    };
};

export default useLiquidityState;
