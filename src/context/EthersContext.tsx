import React, { useCallback, useContext, useEffect, useState } from "react";

import * as Analytics from "expo-firebase-analytics";

import AsyncStorage from "@react-native-community/async-storage";
import sushiData from "@sushiswap/sushi-data";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { MAINNET_PROVIDER } from "../constants/providers";
import { ETH } from "../constants/tokens";
import Ethereum from "../types/Ethereum";
import Token from "../types/Token";
import TokenWithValue from "../types/TokenWithValue";
import { isWETH } from "../utils";
import { fetchTokens, fetchTokenWithValue } from "../utils/fetch-utils";
import { GlobalContext } from "./GlobalContext";

export type OnBlockListener = (block?: number) => void | Promise<void>;

export const EthersContext = React.createContext({
    ethereum: undefined as Ethereum | undefined,
    setEthereum: (_ethereum: Ethereum | undefined) => {},
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.Signer | undefined,
    chainId: 0,
    address: null as string | null,
    ensName: null as string | null,
    addOnBlockListener: (_name: string, _listener: OnBlockListener) => {},
    removeOnBlockListener: (_name: string) => {},
    tokens: [ETH] as TokenWithValue[],
    updateTokens: async () => {},
    loadingTokens: false,
    customTokens: [ETH] as Token[],
    addCustomToken: (_token: Token) => {},
    removeCustomToken: (_token: Token) => {}
});

// tslint:disable-next-line:max-func-body-length
export const EthersContextProvider = ({ children }) => {
    const { mnemonic } = useContext(GlobalContext);
    const [ethereum, setEthereum] = useState<Ethereum | undefined>(window.ethereum);
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.Signer>();
    const [chainId, setChainId] = useState<number>(1);
    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setENSName] = useState<string | null>(null);
    const [onBlockListeners, setOnBlockListeners] = useState<{ [name: string]: OnBlockListener }>({});
    const [tokens, setTokens] = useState<TokenWithValue[]>([]);
    const [customTokens, setCustomTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(false);

    useAsyncEffect(() => {
        if (mnemonic) {
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            setProvider(MAINNET_PROVIDER);
            setSigner(wallet);
            setChainId(1);
            setAddress(wallet.address);
        }
    }, [mnemonic]);

    useAsyncEffect(async () => {
        // Mainnet
        if (ethereum) {
            const web3 = new ethers.providers.Web3Provider(ethereum);
            const web3Signer = await web3.getSigner();
            setProvider(ethereum.isMetaMask ? web3Signer.provider : MAINNET_PROVIDER);
            setSigner(web3Signer);
        }
    }, [ethereum, chainId]);

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
        if (address) {
            const ens = await MAINNET_PROVIDER.lookupAddress(address);
            setENSName(ens);
        }
    }, [address]);

    const updateTokens = async () => {
        if (address && chainId && customTokens && !loadingTokens) {
            setLoadingTokens(true);
            try {
                const list = await fetchTokens(address, customTokens);
                const weth = list.find(t => isWETH(t));
                const p = chainId === 1 ? provider : MAINNET_PROVIDER;
                if (list?.length > 0 && weth && p) {
                    const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
                    setTokens(
                        await Promise.all(
                            list.map(async token => await fetchTokenWithValue(token, weth, wethPriceUSD, p))
                        )
                    );
                }
            } finally {
                setLoadingTokens(false);
            }
        }
    };

    useAsyncEffect(async () => {
        setCustomTokens(JSON.parse((await AsyncStorage.getItem("custom_tokens")) || "[]"));
    }, []);

    useAsyncEffect(async () => {
        if (address && chainId && customTokens) {
            await updateTokens();
        }
    }, [address, chainId, customTokens]);

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
                chainId,
                address,
                ensName,
                tokens,
                updateTokens,
                loadingTokens,
                customTokens,
                addCustomToken,
                removeCustomToken,
                addOnBlockListener,
                removeOnBlockListener
            }}>
            {children}
        </EthersContext.Provider>
    );
};

export const EthersContextConsumer = EthersContext.Consumer;
