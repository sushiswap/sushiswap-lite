import { useCallback } from "react";

import { ethers } from "ethers";
import { SUSHI_BAR } from "../constants/contracts";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";

const useSushiBar = () => {
    const enter = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const sushiBar = getContract("SushiBar", SUSHI_BAR, signer);
        const gasLimit = await sushiBar.estimateGas.enter(amount);
        const tx = await sushiBar.enter(amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "SushiBar.enter()", amount.toString());
    }, []);

    const leave = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const sushiBar = getContract("SushiBar", SUSHI_BAR, signer);
        const gasLimit = await sushiBar.estimateGas.leave(amount);
        const tx = await sushiBar.leave(amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "SushiBar.leave()", amount.toString());
    }, []);

    return {
        enter,
        leave
    };
};

export default useSushiBar;
