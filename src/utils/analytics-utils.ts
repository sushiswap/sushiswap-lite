import * as Analytics from "expo-firebase-analytics";

import { ethers } from "ethers";

export const logTransaction = async (
    tx: ethers.providers.TransactionResponse,
    name: string,
    ...args: any[]
): Promise<ethers.providers.TransactionResponse> => {
    await Analytics.logEvent("tx:" + name, {
        args: args || [],
        hash: tx.hash,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        chainId: tx.chainId
    });
    return tx;
};
