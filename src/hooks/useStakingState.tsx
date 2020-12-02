import { useCallback, useContext, useEffect, useMemo, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { SUSHI_BAR } from "../constants/contracts";
import { EthersContext } from "../context/EthersContext";
import Token from "../types/Token";
import { getContract, parseBalance } from "../utils";
import useSushiBar from "./useSushiBar";

export type StakeAction = "sushi-balance" | "stake";
export type UnstakeAction = "xsushi-balance" | "unstake";

export interface StakingState {
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
    const { signer, address, getTokenAllowance, tokens, updateTokens } = useContext(EthersContext);
    const { enter, leave } = useSushiBar();
    const [sushiStaked, setSushiStaked] = useState<ethers.BigNumber>();
    const [sushiSupply, setSushiSupply] = useState<ethers.BigNumber>();
    const [xSushiSupply, setXSushiSupply] = useState<ethers.BigNumber>();
    const [amount, setAmount] = useState("");
    const [sushiAllowed, setSushiAllowed] = useState(false);
    const [xSushiAllowed, setXSushiAllowed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [entering, setEntering] = useState(false);
    const [leaving, setLeaving] = useState(false);

    const sushi = useMemo(() => tokens.find(token => token.symbol === "SUSHI"), [tokens]);
    const xSushi = useMemo(() => tokens.find(token => token.symbol === "xSUSHI"), [tokens]);

    useEffect(() => {
        setAmount("");
    }, [address]);

    useAsyncEffect(async () => {
        if (sushi && xSushi && signer) {
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
    }, [sushi, xSushi, signer]);

    const onEnter = useCallback(async () => {
        if (amount && sushi && signer) {
            setEntering(true);
            try {
                const parsed = parseBalance(amount, sushi.decimals);
                const tx = await enter(parsed, signer);
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setAmount("");
                }
            } finally {
                setEntering(false);
            }
        }
    }, [amount, sushi, signer]);

    const onLeave = useCallback(async () => {
        if (amount && xSushi && signer) {
            setLeaving(true);
            try {
                const parsed = parseBalance(amount, xSushi.decimals);
                const tx = await leave(parsed, signer);
                if (tx) {
                    await tx.wait();
                    await updateTokens();
                    setAmount("");
                }
            } finally {
                setLeaving(false);
            }
        }
    }, [amount, xSushi, signer]);

    return {
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
