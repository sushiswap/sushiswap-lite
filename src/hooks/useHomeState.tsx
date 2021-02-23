import { useContext, useEffect, useState } from "react";

import sushiData from "@sushiswap/sushi-data";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { EthersContext } from "../context/EthersContext";
import LPTokenWithValue from "../types/LPTokenWithValue";
import { isWETH } from "../utils";
import { fetchLPTokenWithValue, fetchMyLPTokens, fetchMyPools } from "../utils/fetch-utils";

export interface HomeState {
    loadingLPTokens: boolean;
    loadingPools: boolean;
    lpTokens?: LPTokenWithValue[];
    pools?: LPTokenWithValue[];
}

// tslint:disable-next-line:max-func-body-length
const useHomeState = () => {
    const { provider, signer, address, tokens } = useContext(EthersContext);
    const [lpTokens, setLPTokens] = useState<LPTokenWithValue[]>();
    const [pools, setPools] = useState<LPTokenWithValue[]>();
    const [loadingLPTokens, setLoadingLPTokens] = useState(true);
    const [loadingPools, setLoadingPools] = useState(true);

    useEffect(() => {
        setLPTokens(undefined);
        setPools(undefined);
        setLoadingLPTokens(true);
        setLoadingPools(true);
    }, [address]);

    // Load Liquidity
    useAsyncEffect(async () => {
        const weth = tokens.find(t => isWETH(t));
        if (provider && signer && weth && tokens && tokens.length > 0) {
            setLoadingLPTokens(true);
            const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
            const fetched = await fetchMyLPTokens(await signer.getAddress(), tokens, provider);
            try {
                setLPTokens(
                    await Promise.all(
                        fetched.map(lpToken => fetchLPTokenWithValue(lpToken, weth, wethPriceUSD, provider))
                    )
                );
            } finally {
                setLoadingLPTokens(false);
            }
        }
    }, [provider, signer, tokens]);

    // Load Farming
    useAsyncEffect(async () => {
        const weth = tokens.find(t => isWETH(t));
        if (provider && signer && weth && tokens && tokens.length > 0 && lpTokens) {
            setLoadingPools(true);
            const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
            const fetched = await fetchMyPools(await signer.getAddress(), tokens, provider);
            try {
                setPools(
                    await Promise.all(
                        fetched.map(lpToken => fetchLPTokenWithValue(lpToken, weth, wethPriceUSD, provider))
                    )
                );
            } finally {
                setLoadingPools(false);
            }
        }
    }, [provider, signer, tokens, lpTokens]);

    return {
        loadingLPTokens,
        loadingPools,
        tokens,
        lpTokens,
        pools
    };
};

export default useHomeState;
