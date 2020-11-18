import React, { useCallback, useEffect, useState } from "react";

import * as Analytics from "expo-firebase-analytics";

import AsyncStorage from "@react-native-community/async-storage";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import { ETH } from "../constants/tokens";
import Ethereum from "../types/Ethereum";
import Token from "../types/Token";
import { getContract } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import { fetchTokens } from "../utils/fetch-utils";

export type OnBlockListener = (block?: number) => void | Promise<void>;

const PRIVATE_KEY = "0xca417c154948d370f011c5d9ac3fba516d7b15671a069e7d5d48f56b723c9cc1";

export const EthersContext = React.createContext({
    ethereum: undefined as Ethereum | undefined,
    setEthereum: (_ethereum: Ethereum | undefined) => {},
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
    kovanProvider: undefined as ethers.providers.JsonRpcProvider | undefined,
    kovanSigner: undefined as ethers.Signer | undefined,
    chainId: 0,
    address: null as string | null,
    ensName: null as string | null,
    addOnBlockListener: (_name: string, _listener: OnBlockListener) => {},
    removeOnBlockListener: (_name: string) => {},
    tokens: [ETH] as Token[],
    updateTokens: async () => {},
    loadingTokens: false,
    customTokens: [ETH] as Token[],
    addCustomToken: (_token: Token) => {},
    removeCustomToken: (_token: Token) => {},
    approveToken: async (_token: string, _spender: string, _amount?: ethers.BigNumber) => {
        return {} as ethers.providers.TransactionResponse | undefined;
    },
    getTokenAllowance: async (_token: string, _spender: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    },
    getTokenBalance: async (_token: string, _who: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    },
    getTotalSupply: async (_token: string) => {
        return ethers.constants.Zero as ethers.BigNumber | undefined;
    }
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    // const { mnemonic } = useContext(GlobalContext);
    const [ethereum, setEthereum] = useState<Ethereum>();
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [kovanProvider, setKovanProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [kovanSigner, setKovanSigner] = useState<ethers.Signer>();
    const [chainId, setChainId] = useState<number>(1);
    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setENSName] = useState<string | null>(null);
    const [onBlockListeners, setOnBlockListeners] = useState<{ [name: string]: OnBlockListener }>({});
    const [tokens, setTokens] = useState<Token[]>([]);
    const [customTokens, setCustomTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useEffect(() => {
        // Kovan
        const kovan = new ethers.providers.AlchemyProvider(42, "3NGZpyMoljbXikGsz9hWzKZ_bnqbZny2");
        const wallet = new ethers.Wallet(PRIVATE_KEY, kovan);
        setKovanProvider(kovan);
        setKovanSigner(wallet);
    }, []);

    useAsyncEffect(async () => {
        // Mainnet
        if (ethereum) {
            const web3 = new ethers.providers.Web3Provider(ethereum);
            const alchemy = new ethers.providers.AlchemyProvider(
                web3.network,
                __DEV__ ? "DnNxl6bicDp7fp7nF_G23RWIeCGu8xsd" : "DgnfFsj5PXR37FkOmUVJ9GtfDsKws446"
            );
            setProvider(alchemy);
            setSigner(await web3.getSigner());
        }
    }, [ethereum]);

    useEffect(() => {
        if (ethereum) {
            const onAccountsChanged = async () => {
                const accounts = await ethereum.request({ method: "eth_accounts" });
                if (accounts?.[0]) {
                    setAddress(accounts[0]);
                    Analytics.setUserId(accounts[0]);
                } else {
                    setAddress(null);
                }
            };
            const onChainChanged = async () => {
                setChainId(Number(await ethereum.request({ method: "eth_chainId" })));
            };
            const onDisconnect = () => {
                setAddress(null);
                setEthereum(undefined);
            };
            onAccountsChanged();
            onChainChanged();
            ethereum.on("accountsChanged", onAccountsChanged);
            ethereum.on("chainChanged", onChainChanged);
            ethereum.on("disconnect", onDisconnect);
            return () => {
                ethereum.off("accountsChanged", onAccountsChanged);
                ethereum.off("chainChanged", onAccountsChanged);
                ethereum.off("disconnect", onDisconnect);
            };
        }
    }, [ethereum]);

    useAsyncEffect(async () => {
        if (signer && address) {
            const ens = await signer.provider.lookupAddress(address);
            setENSName(ens);
        }
    }, [signer, address]);

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
        if (address && provider && signer && customTokens) {
            try {
                const data = await fetchTokens(address, provider, signer, customTokens);
                if (data) {
                    await setTokens(data);
                }
            } finally {
                setLoadingTokens(false);
            }
        }
    };

    useAsyncEffect(async () => {
        await AsyncStorage.removeItem("custom_tokens");
        // setCustomTokens(JSON.parse((await AsyncStorage.getItem("custom_tokens")) || "[]"));
    }, []);

    useAsyncEffect(async () => {
        if (address && provider && signer && customTokens) {
            setLoadingTokens(true);
            await updateTokens();
        }
    }, [provider, signer, address, customTokens]);

    const addCustomToken = useCallback(
        async (token: Token) => {
            if (
                customTokens.findIndex(t => t.address === token.address) === -1 &&
                tokens.findIndex(t => t.address === token.address) === -1
            ) {
                const custom = [...customTokens, token];
                setCustomTokens(custom);
                await AsyncStorage.setItem("custom_tokens", JSON.stringify(custom));
            }
        },
        [tokens, customTokens]
    );

    const removeCustomToken = useCallback(
        async (token: Token) => {
            if (customTokens.findIndex(t => t.address === token.address) !== -1) {
                const custom = customTokens.filter(t => t.address !== token.address);
                setCustomTokens(custom);
                await AsyncStorage.setItem("custom_tokens", JSON.stringify(custom));
            }
        },
        [customTokens]
    );

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
            if (provider && address) {
                return await provider.send("alchemy_getTokenAllowance", [
                    {
                        contract: token,
                        owner: address,
                        spender
                    }
                ]);
            }
        },
        [provider, address]
    );

    const getTokenBalance = useCallback(
        async (token: string, who: string) => {
            if (provider && signer) {
                const erc20 = getContract("ERC20", token, signer);
                return await erc20.balanceOf(who);
            }
        },
        [provider, signer]
    );

    const getTotalSupply = useCallback(
        async (token: string) => {
            if (signer) {
                const erc20 = getContract("ERC20", token, signer);
                return await erc20.totalSupply();
            }
        },
        [signer]
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
        if (provider && chainId === 1) {
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
    }, [provider, chainId, onBlockListeners]);

    return (
        <EthersContext.Provider
            value={{
                ethereum,
                setEthereum,
                provider,
                signer,
                kovanProvider,
                kovanSigner,
                chainId,
                address,
                ensName,
                tokens,
                updateTokens,
                loadingTokens,
                customTokens,
                addCustomToken,
                removeCustomToken,
                approveToken,
                getTokenAllowance,
                getTokenBalance,
                getTotalSupply,
                addOnBlockListener,
                removeOnBlockListener
            }}>
            {children}
        </EthersContext.Provider>
    );
};

export const EthersContextConsumer = EthersContext.Consumer;
