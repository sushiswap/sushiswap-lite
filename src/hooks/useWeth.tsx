import { useCallback } from "react";

import { WETH } from "@sushiswap/sdk";
import { ethers } from "ethers";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";

const useWeth = () => {
    const wrapETH = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const weth = getContract("IWETH", WETH[1].address, signer);
        const gasLimit = await weth.estimateGas.deposit({
            value: amount
        });
        const tx = await weth.deposit({
            value: amount,
            gasLimit
        });
        return await logTransaction(tx, "WETH.deposit()");
    }, []);

    const unwrapETH = useCallback(async (amount: ethers.BigNumber, signer: ethers.Signer) => {
        const weth = getContract("IWETH", WETH[1].address, signer);
        const gasLimit = await weth.estimateGas.withdraw(amount);
        const tx = await weth.withdraw(amount, {
            gasLimit
        });
        return await logTransaction(tx, "WETH.withdraw()");
    }, []);

    return {
        wrapETH,
        unwrapETH
    };
};

export default useWeth;
