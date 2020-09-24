import ERC20 from "@levx/sushiswap-core/build/contracts/ERC20.json";
import IUniswapV2Factory from "@levx/sushiswap-core/build/contracts/IUniswapV2Factory.json";
import IUniswapV2Pair from "@levx/sushiswap-core/build/contracts/IUniswapV2Pair.json";
import IUniswapV2Router02 from "@levx/sushiswap-core/build/contracts/IUniswapV2Router02.json";
import IWETH from "@levx/sushiswap-core/build/contracts/IWETH.json";
import MasterChef from "@levx/sushiswap-core/build/contracts/MasterChef.json";
import { ChainId, CurrencyAmount, Token as SDKToken, TokenAmount, WETH } from "@levx/sushiswap-sdk";
import { ethers } from "ethers";
import Token from "../types/Token";

const CONTRACTS = {
    ERC20,
    IUniswapV2Factory,
    IUniswapV2Pair,
    IUniswapV2Router02,
    IWETH,
    MasterChef
};

export const formatBalance = (value: ethers.BigNumberish, decimals = 18, maxFraction = 0) => {
    const formatted = ethers.utils.formatUnits(value, decimals);
    if (maxFraction > 0) {
        const split = formatted.split(".");
        if (split.length > 1) {
            return split[0] + "." + split[1].substr(0, maxFraction);
        }
    }
    return formatted;
};

export const parseBalance = (value: string, decimals = 18) => {
    return ethers.utils.parseUnits(value || "0", decimals);
};

export const isEmptyValue = (text: string) =>
    ethers.BigNumber.isBigNumber(text)
        ? ethers.BigNumber.from(text).isZero()
        : text === "" || text.replace(/0/g, "").replace(/\./, "") === "";

export const convertToken = (token: Token) => {
    return token.symbol === "ETH" ? WETH["1"] : new SDKToken(ChainId.MAINNET, token.address, token.decimals);
};

export const convertAmount = (token: Token, amount: string) => {
    return new TokenAmount(convertToken(token), parseBalance(amount, token.decimals).toString());
};

export const parseCurrencyAmount = (value: CurrencyAmount, decimals = 18) => {
    return ethers.BigNumber.from(parseBalance(value.toExact(), decimals));
};

export const getContract = (name: string, address: string, signer: ethers.Signer) => {
    const contract = CONTRACTS[name];
    return ethers.ContractFactory.getContract(address, contract.abi, signer);
};
