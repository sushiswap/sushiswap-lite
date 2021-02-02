import React, { useCallback, useEffect, useState } from "react";

import * as Analytics from "expo-firebase-analytics";

import AsyncStorage from "@react-native-community/async-storage";
import sushiData from "@sushiswap/sushi-data";
import { ethers } from "ethers";
import useAsyncEffect from "use-async-effect";
import Fraction from "../constants/Fraction";
import { ETH } from "../constants/tokens";
import useSDK from "../hooks/useSDK";
import Ethereum from "../types/Ethereum";
import Token from "../types/Token";
import TokenWithValue from "../types/TokenWithValue";
import { getContract, isWETH } from "../utils";
import { logTransaction } from "../utils/analytics-utils";
import { fetchTokens, fetchTokenWithValue } from "../utils/fetch-utils";

export type OnBlockListener = (block?: number) => void | Promise<void>;

export const ALCHEMY_PROVIDER = new ethers.providers.AlchemyProvider(
    1,
    __DEV__ ? process.env.MAINNET_API_KEY : "DgnfFsj5PXR37FkOmUVJ9GtfDsKws446"
);
export const KOVAN_PROVIDER = new ethers.providers.AlchemyProvider(
    42,
    __DEV__ ? process.env.KOVAN_API_KEY : "8a03ORJJcIv8YA49M-cIxg-mBEMJYe0J"
);

export const EthersContext = React.createContext({
    ethereum: undefined as Ethereum | undefined,
    setEthereum: (_ethereum: Ethereum | undefined) => {},
    provider: undefined as ethers.providers.JsonRpcProvider | undefined,
    signer: undefined as ethers.providers.JsonRpcSigner | undefined,
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
    const { getPair } = useSDK();
    const [ethereum, setEthereum] = useState<Ethereum | undefined>(window.ethereum);
    const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();
    const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
    const [chainId, setChainId] = useState<number>(1);
    const [address, setAddress] = useState<string | null>(null);
    const [ensName, setENSName] = useState<string | null>(null);
    const [onBlockListeners, setOnBlockListeners] = useState<{ [name: string]: OnBlockListener }>({});
    const [tokens, setTokens] = useState<TokenWithValue[]>([]);
    const [customTokens, setCustomTokens] = useState<Token[]>([]);
    const [loadingTokens, setLoadingTokens] = useState(true);

    useAsyncEffect(async () => {
        // Mainnet
        if (ethereum) {
            const web3 = new ethers.providers.Web3Provider(ethereum);
            const web3Signer = await web3.getSigner();
            setProvider(ethereum.isMetaMask ? web3Signer.provider : ALCHEMY_PROVIDER);
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
        if (provider && address) {
            const ens = await ALCHEMY_PROVIDER.lookupAddress(address);
            setENSName(ens);
        }
    }, [provider, address]);

    const updateTokens = async () => {
        if (address && chainId && customTokens) {
            try {
                const list = await fetchTokens(address, customTokens);
                const weth = list.find(t => isWETH(t));
                const p = chainId === 1 ? provider : ALCHEMY_PROVIDER;
                if (list?.length > 0 && weth && p) {
                    const wethPriceUSD = Fraction.parse(String(await sushiData.weth.price()));
                    setTokens(
                        await Promise.all(
                            list.map(async token => await fetchTokenWithValue(token, weth, wethPriceUSD, getPair, p))
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
            setLoadingTokens(true);
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
                const erc20 = getContract("ERC20", token, provider);
                return erc20.allowance(address, spender);
            }
        },
        [provider, address]
    );

    const getTokenBalance = useCallback(
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
