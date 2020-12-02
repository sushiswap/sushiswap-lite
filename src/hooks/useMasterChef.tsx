import { useCallback } from "react";

import { ethers } from "ethers";
import { MASTER_CHEF } from "../constants/contracts";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";

const useMasterChef = () => {
    const deposit = useCallback(async (lpTokenId: number, amount: ethers.BigNumber, signer: ethers.Signer) => {
        const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
        const gasLimit = await masterChef.estimateGas.deposit(lpTokenId, amount);
        const tx = await masterChef.deposit(lpTokenId, amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "MasterChef.deposit()", lpTokenId, amount.toString());
    }, []);

    const withdraw = useCallback(async (lpTokenId: number, amount: ethers.BigNumber, signer: ethers.Signer) => {
        const masterChef = getContract("MasterChef", MASTER_CHEF, signer);
        const gasLimit = await masterChef.estimateGas.withdraw(lpTokenId, amount);
        const tx = await masterChef.withdraw(lpTokenId, amount, {
            gasLimit: gasLimit.mul(120).div(100)
        });
        return logTransaction(tx, "MasterChef.withdraw()", lpTokenId, amount.toString());
    }, []);

    return {
        deposit,
        withdraw
    };
};

export default useMasterChef;
