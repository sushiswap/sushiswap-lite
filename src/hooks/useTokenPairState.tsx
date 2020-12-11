import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ROUTER } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import Token from "../types/Token";
import { isETH, parseBalance } from "../utils";
import useWeth from "./useWeth";

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
    loading: boolean;
    onWrap: () => Promise<void>;
    wrapping: boolean;
    onUnwrap: () => Promise<void>;
    unwrapping: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useTokenPairState: () => TokenPairState = () => {
    const { signer, address, tokens, updateTokens, getTokenAllowance } = useContext(EthersContext);
    const { wrapETH, unwrapETH } = useWeth();
    const [fromSymbol, setFromSymbol] = useState("");
    const [toSymbol, setToSymbol] = useState("");
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [fromTokenAllowed, setFromTokenAllowed] = useState(false);
    const [toTokenAllowed, setToTokenAllowed] = useState(false);
    const [loading, setLoading] = useState(false);
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
        if (fromToken && toToken && signer) {
            setFromTokenAllowed(false);
            setToTokenAllowed(false);
            setLoading(true);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                if (!isETH(fromToken)) {
                    const fromAllowance = await getTokenAllowance(fromToken.address, ROUTER);
                    setFromTokenAllowed(ethers.BigNumber.from(fromAllowance).gte(minAllowance));
                }
                if (!isETH(toToken)) {
                    const toAllowance = await getTokenAllowance(toToken.address, ROUTER);
                    setToTokenAllowed(ethers.BigNumber.from(toAllowance).gte(minAllowance));
                }
            } finally {
                setLoading(false);
            }
        }
    }, [fromToken, toToken, signer]);

    const onWrap = useCallback(async () => {
        if (fromAmount && signer) {
            setWrapping(true);
            try {
                const tx = await wrapETH(parseBalance(fromAmount), signer);
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
                const tx = await unwrapETH(parseBalance(fromAmount), signer);
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
        loading,
        onWrap,
        wrapping,
        onUnwrap,
        unwrapping
    };
};

export default useTokenPairState;
