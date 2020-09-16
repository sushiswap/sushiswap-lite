import { useContext, useState } from "react";

import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import LPToken from "../types/LPToken";
import useSDK from "./useSDK";

export interface RemoveLiquidityState {
    loading: boolean;
    lpTokens?: LPToken[];
    selectedLPToken?: LPToken;
    setSelectedLPToken: (token?: LPToken) => void;
}

// tslint:disable-next-line:max-func-body-length
const useRemoveLiquidityState: () => RemoveLiquidityState = () => {
    const { provider, signer, address } = useContext(EthersContext);
    const { tokens } = useContext(GlobalContext);
    const { getLPTokensWithBalances } = useSDK();
    const [loading, setLoading] = useState(false);
    const [lpTokens, setLPTokens] = useState<LPToken[]>();
    const [selectedLPToken, setSelectedLPToken] = useState<LPToken>();

    useAsyncEffect(async () => {
        if (provider && signer && tokens) {
            setLoading(true);
            try {
                const data = await getLPTokensWithBalances();
                if (data) {
                    setLPTokens(data);
                }
            } finally {
                setLoading(false);
            }
        }
    }, [provider, signer, tokens, address]);

    return {
        loading,
        lpTokens,
        selectedLPToken,
        setSelectedLPToken
    };
};

export default useRemoveLiquidityState;
