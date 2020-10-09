import React, { useCallback, useEffect, useState } from "react";

import * as Analytics from "expo-firebase-analytics";

import { EventType, Listener } from "@ethersproject/abstract-provider";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ETH } from "../constants/tokens";
import Token from "../types/Token";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import { fetchTokens } from "../utils/fetch-utils";

export type OnBlockListener = (block: number) => Promise<void>;

export const EthersContext = React.createContext({
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
    chainId: 0,
    address: null as string | null,
    addOnBlockListener: (_name: string, _listener: OnBlockListener) => {},
    removeOnBlockListener: (_name: string) => {},
    tokens: [ETH] as Token[],
    updateTokens: async () => {},
    loadingTokens: false,
    approveToken: async (_token: string, _spender: string, _amount?: ethers.BigNumber) => {
        return {} as ethers.providers.TransactionResponse | undefined;
    },
    getTokenAllowance: async (_token: string, _spender: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    }
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    const { mnemonic } = useContext(GlobalContext);
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [chainId, setChainId] = useState<number>(1);
    const [address, setAddress] = useState<string | null>(ethers.constants.AddressZero);
    const [onBlockListeners, setOnBlockListeners] = useState<{ [name: string]: OnBlockListener }>({});
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useAsyncEffect(async () => {
        // Mainnet
        if (window.ethereum) {
            const web3 = new ethers.providers.Web3Provider(window.ethereum);
            const alchemy = new ethers.providers.AlchemyProvider(
                web3.network,
                __DEV__ ? "gSgAj0Ntfsn-DOKKlUhjqeUlePrVX8va" : "yLD5iJzUEo_Kvlg_PwMXl7N9ESK2_b6E"
            );
            setProvider(alchemy);
            setSigner(await web3.getSigner());
        }
    }, [window.ethereum]);

    useEffect(() => {
        if (window.ethereum) {
            const onAccountsChanged = () => {
                setAddress(window.ethereum.selectedAddress);
                if (window.ethereum.chainId && window.ethereum.selectedAddress) {
                    Analytics.setUserId(Number(window.ethereum.chainId) + ":" + window.ethereum.selectedAddress);
                }
            };
            const onChainChanged = () => {
                setChainId(Number(window.ethereum.chainId));
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

    // Set provider and signer for mobile app
    // useEffect(() => {
    //     if (mnemonic) {
    //         const alchemy = new ethers.providers.AlchemyProvider(1, Constants.manifest.extra.alchemyApiKey);
    //         setProvider(alchemy);
    //         const wallet = ethers.Wallet.fromMnemonic(mnemonic).connect(alchemy);
    //         setSigner(wallet);
    //     }
    // }, [mnemonic]);

    const updateTokens = async () => {
        try {
            const data = await fetchTokens(provider, signer);
            if (data) {
                await setTokens(data);
            }
        } finally {
            setLoadingTokens(false);
        }
    };

    useAsyncEffect(async () => {
        if (provider && signer) {
            setLoadingTokens(true);
            await updateTokens();
        }
    }, [provider, signer, address]);

    const approveToken = useCallback(
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
                tokens,
                updateTokens,
                loadingTokens,
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
            chainId: string;
            on(eventName: EventType, listener: Listener);
            off(eventName: EventType, listener: Listener);
        };
    }
}

export const EthersContextConsumer = EthersContext.Consumer;
