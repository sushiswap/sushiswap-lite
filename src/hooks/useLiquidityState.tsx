import { useContext, useState } from "react";

import { Pair } from "@sushiswap/sdk";
import { EthersContext } from "../context/EthersContext";
import useDelayedOnBlockEffect from "./useDelayedOnBlockEffect";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface LiquidityState extends TokenPairState {
    pair?: Pair;
}

// tslint:disable-next-line:max-func-body-length
const useLiquidityState: () => LiquidityState = () => {
    const state = useTokenPairState();
    const { provider } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const [pair, setPair] = useState<Pair>();
    const { getPair } = useSDK();

    useDelayedOnBlockEffect(
        async block => {
            if (state.fromToken && state.toToken && provider) {
                if (!block) {
                    setLoading(true);
                }
                try {
                    setPair(await getPair(state.fromToken, state.toToken, provider));
                } finally {
                    setLoading(false);
                }
            }
        },
        () => "getPair(" + state.fromSymbol + "," + state.toSymbol + ")",
        [state.fromSymbol, state.toSymbol, provider],
        0
    );

    return {
        ...state,
        loading: loading || state.loading,
        pair
    };
};

export default useLiquidityState;
