import { useCallback, useContext } from "react";

import { ethers } from "ethers";
import { EthersContext } from "../context/EthersContext";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";

// tslint:disable-next-line:max-func-body-length
const useERC20 = () => {
    const { address, signer, provider } = useContext(EthersContext);

    const approve = useCallback(
        async (token: string, spender: string, amount?: ethers.BigNumber) => {
            if (signer) {
                amount = amount || ethers.constants.MaxUint256;
                const erc20 = getContract("ERC20", token, signer);
                const gasLimit = await erc20.estimateGas.approve(spender, amount);
                const tx = await erc20.approve(spender, amount, {
                    gasLimit
                });
                return await logTransaction(tx, "ERC20.approve()", spender, amount.toString());
            }
        },
        [signer]
    );

    const getAllowance = useCallback(
        async (token: string, spender: string) => {
            if (provider && address) {
                const erc20 = getContract("ERC20", token, provider);
                return erc20.allowance(address, spender);
            }
        },
        [provider, address]
    );

    const getBalance = useCallback(
        async (token: string, who: string) => {
            if (provider) {
                const erc20 = getContract("ERC20", token, provider);
                return await erc20.balanceOf(who);
            }
        },
        [provider]
    );

    const getTotalSupply = useCallback(
        async (token: string) => {
            if (provider) {
                const erc20 = getContract("ERC20", token, provider);
                return await erc20.totalSupply();
            }
        },
        [provider]
    );

    return { approve, getAllowance, getBalance, getTotalSupply };
};

export default useERC20;
