import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import Token from "../types/Token";
import { parseBalance } from "../utils";
import useSDK, { ROUTER } from "./useSDK";

export interface TokenPairState {
    fromSymbol: string;
    setFromSymbol: (symbol: string) => void;
    toSymbol: string;
    setToSymbol: (symbol: string) => void;
    fromToken?: Token;
    toToken?: Token;
    fromAmount: string;
    setFromAmount: (amount: string) => void;
    toAmount: string;
    setToAmount: (amount: string) => void;
    fromTokenAllowed: boolean;
    setFromTokenAllowed: (allowed: boolean) => void;
    toTokenAllowed: boolean;
    setToTokenAllowed: (allowed: boolean) => void;
    loadingAllowance: boolean;
    setLoadingAllowance: (loading: boolean) => void;
    onWrap: () => Promise<void>;
    wrapping: boolean;
    onUnwrap: () => Promise<void>;
    unwrapping: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useTokenPairState: () => TokenPairState = () => {
    const { tokens, updateTokens } = useContext(GlobalContext);
    const { provider, signer, address, getTokenAllowance } = useContext(EthersContext);
    const { wrapETH, unwrapETH } = useSDK();
    const [fromSymbol, setFromSymbol] = useState("");
    const [toSymbol, setToSymbol] = useState("");
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [fromTokenAllowed, setFromTokenAllowed] = useState(false);
    const [toTokenAllowed, setToTokenAllowed] = useState(false);
    const [loadingAllowance, setLoadingAllowance] = useState(false);
    const [wrapping, setWrapping] = useState(false);
    const [unwrapping, setUnwrapping] = useState(false);

    const fromToken = tokens.find(token => token.symbol === fromSymbol);
    const toToken = tokens.find(token => token.symbol === toSymbol);

    useEffect(() => {
        if (fromSymbol === "") {
            setToSymbol("");
        }
        setFromAmount("");
        setToAmount("");
    }, [fromSymbol, toSymbol]);

    useEffect(() => {
        setFromSymbol("");
    }, [address]);

    useAsyncEffect(async () => {
        if (fromToken && toToken && provider && signer) {
            if (fromToken.symbol !== "ETH") {
                setFromTokenAllowed(false);
                setToTokenAllowed(false);
                setLoadingAllowance(true);
                try {
                    const minAllowance = ethers.BigNumber.from(2)
                        .pow(96)
                        .sub(1);
                    const fromAllowance = await getTokenAllowance(fromToken.address, ROUTER);
                    const toAllowance = await getTokenAllowance(toToken.address, ROUTER);
                    setFromTokenAllowed(ethers.BigNumber.from(fromAllowance).gte(minAllowance));
                    setToTokenAllowed(ethers.BigNumber.from(toAllowance).gte(minAllowance));
                } finally {
                    setLoadingAllowance(false);
                }
            }
        }
    }, [fromToken, toToken, provider, signer]);

    const onWrap = useCallback(async () => {
        if (fromAmount && signer) {
            setWrapping(true);
            try {
                const tx = await wrapETH(parseBalance(fromAmount));
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setFromSymbol("");
                }
            } finally {
                setWrapping(false);
            }
        }
    }, [fromAmount, signer]);

    const onUnwrap = useCallback(async () => {
        if (fromAmount && signer) {
            setUnwrapping(true);
            try {
                const tx = await unwrapETH(parseBalance(fromAmount));
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setFromSymbol("");
                }
            } finally {
                setUnwrapping(false);
            }
        }
    }, [fromAmount, signer]);

    return {
        fromSymbol,
        setFromSymbol,
        toSymbol,
        setToSymbol,
        fromToken,
        toToken,
        fromAmount,
        setFromAmount,
        toAmount,
        setToAmount,
        fromTokenAllowed,
        setFromTokenAllowed,
        toTokenAllowed,
        setToTokenAllowed,
        loadingAllowance,
        setLoadingAllowance,
        onWrap,
        wrapping,
        onUnwrap,
        unwrapping
    };
};

export default useTokenPairState;
