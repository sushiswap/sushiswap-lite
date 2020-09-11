import React, { useCallback, useEffect, useState } from "react";

import { EventType, Listener } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ROUTER } from "../hooks/useSDK";

export type OnBlockListener = (block: number) => Promise<void>;

export const EthersContext = React.createContext({
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
    address: null as string | null,
    addOnBlockListener: (listener: OnBlockListener) => {},
    removeOnBlockListener: (listener: OnBlockListener) => {},
    approveToken: async (token: string, spender: string, amount?: ethers.BigNumber) => {
        return {} as ethers.providers.TransactionResponse;
    },
    getTokenAllowance: async (token: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    }
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [address, setAddress] = useState<string | null>(null);
    const [onBlockListeners, setOnBlockListeners] = useState([] as OnBlockListener[]);
    useAsyncEffect(async () => {
        if (window.ethereum) {
            const web3 = new ethers.providers.Web3Provider(window.ethereum);
            const alchemy = new ethers.providers.AlchemyProvider(web3.network, process.env.API_KEY);
            setProvider(alchemy);
            setSigner(await web3.getSigner());
        }
    }, [window.ethereum]);
    useEffect(() => {
        if (window.ethereum) {
            const onAccountsChanged = () => {
                setAddress(window.ethereum.selectedAddress);
            };
            onAccountsChanged();
            window.ethereum.on("accountsChanged", onAccountsChanged);
            return () => {
                window.ethereum.off("accountsChanged", onAccountsChanged);
            };
        }
    }, [window.ethereum]);
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
    const getTokenAllowance = useCallback(
        async (token: string) => {
            if (provider && signer) {
                return await provider.send("alchemy_getTokenAllowance", [
                    {
                        contract: token,
                        owner: await signer.getAddress(),
                        spender: ROUTER
                    }
                ]);
            }
        },
        [provider, signer]
    );
    const addOnBlockListener = useCallback(
        listener => {
            setOnBlockListeners([...onBlockListeners, listener]);
        },
        [onBlockListeners]
    );
    const removeOnBlockListener = useCallback(
        l => {
            setOnBlockListeners(onBlockListeners.filter(listener => listener !== l));
        },
        [onBlockListeners]
    );
    useEffect(() => {
        if (provider && signer) {
            const onBlock = async (block: number) => {
                for (const listener of onBlockListeners) {
                    await listener?.(block);
                }
            };
            provider.on("block", onBlock);
            return () => {
                provider.off("block", onBlock);
            };
        }
    }, [provider, signer, onBlockListeners]);
    return (
        <EthersContext.Provider
            value={{
                provider,
                signer,
                address,
                approveToken,
                getTokenAllowance,
                addOnBlockListener,
                removeOnBlockListener
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
            selectedAddress: string;
            on(eventName: EventType, listener: Listener);
            off(eventName: EventType, listener: Listener);
        };
    }
}

export const EthersContextConsumer = EthersContext.Consumer;
