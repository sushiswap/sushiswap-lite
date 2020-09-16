import React, { useCallback, useEffect, useState } from "react";

import { EventType, Listener } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";

export type OnBlockListener = (block: number) => Promise<void>;

export const EthersContext = React.createContext({
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
    chainId: 0,
    address: null as string | null,
    addOnBlockListener: (name: string, listener: OnBlockListener) => {},
    removeOnBlockListener: (name: string) => {},
    approveToken: async (token: string, spender: string, amount?: ethers.BigNumber) => {
        return {} as ethers.providers.TransactionResponse;
    },
    getTokenAllowance: async (token: string, spender: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    }
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [chainId, setChainId] = useState<number>(1);
    const [address, setAddress] = useState<string | null>(ethers.constants.AddressZero);
    const [onBlockListeners, setOnBlockListeners] = useState<{ [name: string]: OnBlockListener }>({});
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
            const onChainChanged = async () => {
                const network = await signer?.provider?.getNetwork();
                if (network) {
                    setChainId(network.chainId);
                }
            };
            onAccountsChanged();
            onChainChanged();
            window.ethereum.on("accountsChanged", onAccountsChanged);
            window.ethereum.on("chainChanged", onChainChanged);
            return () => {
                window.ethereum.off("accountsChanged", onAccountsChanged);
                window.ethereum.off("chainChanged", onAccountsChanged);
            };
        }
    }, [window.ethereum, signer]);
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
        async (token: string, spender: string) => {
            if (provider && signer) {
                return await provider.send("alchemy_getTokenAllowance", [
                    {
                        contract: token,
                        owner: await signer.getAddress(),
                        spender
                    }
                ]);
            }
        },
        [provider, signer]
    );
    const addOnBlockListener = useCallback(
        (name, listener) => {
            setOnBlockListeners(old => ({ ...old, [name]: listener }));
        },
        [setOnBlockListeners]
    );
    const removeOnBlockListener = useCallback(
        name => {
            setOnBlockListeners(old => {
                delete old[name];
                return old;
            });
        },
        [setOnBlockListeners]
    );
    useEffect(() => {
        if (provider && signer && chainId === 1) {
            const onBlock = async (block: number) => {
                for (const listener of Object.entries(onBlockListeners)) {
                    await listener[1]?.(block);
                }
            };
            provider.on("block", onBlock);
            return () => {
                provider.off("block", onBlock);
            };
        }
    }, [provider, signer, chainId, onBlockListeners]);
    return (
        <EthersContext.Provider
            value={{
                provider,
                signer,
                chainId,
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
