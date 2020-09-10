import React, { useCallback, useState } from "react";

import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";

export const EthersContext = React.createContext({
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
    approveToken: async (token: string, spender: string, amount?: ethers.BigNumber) => {
        return {} as ethers.providers.TransactionResponse;
    }
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    useAsyncEffect(async () => {
        await window.ethereum.enable();
        const web3 = new ethers.providers.Web3Provider(window.ethereum);
        const alchemy = new ethers.providers.AlchemyProvider(web3.network, process.env.API_KEY);
        setProvider(alchemy);
        setSigner(await web3.getSigner());
    }, []);
    const approveToken = useCallback(
        async (token: string, spender: string, amount?: ethers.BigNumber) => {
            amount = amount || ethers.constants.MaxUint256;
            const { abi } = require("@uniswap/v2-core/build/IERC20.json");
            const erc20 = ethers.ContractFactory.getContract(token, abi, signer);
            const gasLimit = await erc20.estimateGas.approve(spender, amount);
            return await erc20.approve(spender, amount, {
                gasLimit
            });
        },
        [signer]
    );
    return (
        <EthersContext.Provider
            value={{
                provider,
                signer,
                approveToken
            }}>
            {children}
        </EthersContext.Provider>
    );
};

interface JsonRPCRequest {
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
}

interface JsonRPCResponse {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: string;
}

interface Callback<ResultType> {
    (error: Error): void;
    (error: null, val: ResultType): void;
}

declare global {
    interface Window {
        ethereum: {
            enable(): void;
            send(payload: any, callback: any): any;
            send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any;
        };
    }
}

export const EthersContextConsumer = EthersContext.Consumer;
