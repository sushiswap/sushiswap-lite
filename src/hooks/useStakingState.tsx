import { useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { SUSHI_BAR } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import Token from "../types/Token";
import { getContract, parseBalance } from "../utils";
import useSDK from "./useSDK";

export type Action = "enter" | "leave";

export interface StakingState {
    action?: Action;
    setAction: (action?: Action) => void;
    sushi?: Token;
    xSushi?: Token;
    sushiStaked?: ethers.BigNumber;
    sushiSupply?: ethers.BigNumber;
    xSushiSupply?: ethers.BigNumber;
    amount: string;
    setAmount: (amount: string) => void;
    sushiAllowed: boolean;
    setSushiAllowed: (allowed: boolean) => void;
    xSushiAllowed: boolean;
    setXSushiAllowed: (allowed: boolean) => void;
    loading: boolean;
    onEnter: () => Promise<void>;
    entering: boolean;
    onLeave: () => Promise<void>;
    leaving: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useStakingState: () => StakingState = () => {
    const { provider, signer, address, getTokenAllowance, tokens, updateTokens } = useContext(EthersContext);
    const { enterSushiBar, leaveSushiBar } = useSDK();
    const [action, setAction] = useState<Action>();
    const [sushiStaked, setSushiStaked] = useState<ethers.BigNumber>();
    const [sushiSupply, setSushiSupply] = useState<ethers.BigNumber>();
    const [xSushiSupply, setXSushiSupply] = useState<ethers.BigNumber>();
    const [amount, setAmount] = useState("");
    const [sushiAllowed, setSushiAllowed] = useState(false);
    const [xSushiAllowed, setXSushiAllowed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [entering, setEntering] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const sushi = tokens.find(token => token.symbol === "SUSHI");
    const xSushi = tokens.find(token => token.symbol === "xSUSHI");

    useEffect(() => {
        setAmount("");
    }, [address, action]);

    useAsyncEffect(async () => {
        if (sushi && xSushi && provider && signer) {
            setSushiAllowed(false);
            setXSushiAllowed(false);
            setLoading(true);
            try {
                const minAllowance = ethers.BigNumber.from(2)
                    .pow(96)
                    .sub(1);
                const sushiAllowance = await getTokenAllowance(sushi.address, SUSHI_BAR);
                setSushiAllowed(ethers.BigNumber.from(sushiAllowance).gte(minAllowance));
                const xSushiAllowance = await getTokenAllowance(xSushi.address, SUSHI_BAR);
                setXSushiAllowed(ethers.BigNumber.from(xSushiAllowance).gte(minAllowance));

                const sushiContract = getContract("ERC20", sushi.address, signer);
                setSushiStaked(await sushiContract.balanceOf(SUSHI_BAR));
                setSushiSupply(await sushiContract.totalSupply());
                const xSushiContract = getContract("ERC20", xSushi.address, signer);
                setXSushiSupply(await xSushiContract.totalSupply());
            } finally {
                setLoading(false);
            }
        }
    }, [sushi, xSushi, provider, signer]);

    const onEnter = useCallback(async () => {
        if (amount && signer) {
            setEntering(true);
            try {
                const tx = await enterSushiBar(parseBalance(amount), signer);
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setAmount("");
                }
            } finally {
                setEntering(false);
            }
        }
    }, [amount, signer]);

    const onLeave = useCallback(async () => {
        if (amount && signer) {
            setLeaving(true);
            try {
                const tx = await leaveSushiBar(parseBalance(amount), signer);
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setAmount("");
                }
            } finally {
                setLeaving(false);
            }
        }
    }, [amount, signer]);

    return {
        action,
        setAction,
        sushi,
        xSushi,
        sushiStaked,
        sushiSupply,
        xSushiSupply,
        amount,
        setAmount,
        sushiAllowed,
        setSushiAllowed,
        xSushiAllowed,
        setXSushiAllowed,
        loading,
        onEnter,
        entering,
        onLeave,
        leaving
    };
};

export default useStakingState;
