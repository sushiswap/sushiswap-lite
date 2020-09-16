import { useContext, useState } from "react";

import { Pair } from "@levx/sushiswap-sdk";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import useSDK from "./useSDK";
import useTokenPairState, { TokenPairState } from "./useTokenPairState";

export interface LiquidityState extends TokenPairState {
    loading: boolean;
    pair?: Pair;
}

// tslint:disable-next-line:max-func-body-length
const useLiquidityState: () => LiquidityState = () => {
    const state = useTokenPairState();
    const { provider, signer } = useContext(EthersContext);
    const [loading, setLoading] = useState(false);
    const [pair, setPair] = useState<Pair>();
    const { getPair } = useSDK();

    useAsyncEffect(async () => {
        setPair(undefined);
        if (state.fromToken && state.toToken && provider && signer) {
            setLoading(true);
            if (state.fromToken && state.toToken) {
                try {
                    setPair(await getPair(state.fromToken, state.toToken));
                } catch (e) {
                } finally {
                    setLoading(false);
                }
            }
        }
    }, [state.fromToken, state.toToken, provider, signer, getPair]);

    return {
        ...state,
        loading: loading || state.loading,
        pair
    };
};

export default useLiquidityState;
