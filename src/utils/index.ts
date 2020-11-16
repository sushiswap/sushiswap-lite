import ERC20 from "@sushiswap/core/build/contracts/ERC20.json";
import IUniswapV2Factory from "@sushiswap/core/build/contracts/IUniswapV2Factory.json";
import IUniswapV2Pair from "@sushiswap/core/build/contracts/IUniswapV2Pair.json";
import IUniswapV2Router02 from "@sushiswap/core/build/contracts/IUniswapV2Router02.json";
import IWETH from "@sushiswap/core/build/contracts/IWETH.json";
import MasterChef from "@sushiswap/core/build/contracts/MasterChef.json";
import SushiBar from "@sushiswap/core/build/contracts/SushiBar.json";
import SushiRoll from "@sushiswap/core/build/contracts/SushiRoll.json";
import { ChainId, CurrencyAmount, Token as SDKToken, TokenAmount, WETH } from "@sushiswap/sdk";
import OrderBook from "@sushiswap/settlement/deployments/kovan/OrderBook.json";
import Settlement from "@sushiswap/settlement/deployments/mainnet/Settlement.json";
import { ethers } from "ethers";
import LPTokenScanner from "../constants/abi/LPTokenScanner.json";
import Token from "../types/Token";

const CONTRACTS = {
    ERC20,
    IUniswapV2Factory,
    IUniswapV2Pair,
    IUniswapV2Router02,
    IWETH,
    MasterChef,
    SushiBar,
    SushiRoll,
    OrderBook,
    Settlement,
    LPTokenScanner: { abi: LPTokenScanner }
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

export const pow10 = (exp: ethers.BigNumberish) => {
    return ethers.BigNumber.from(10).pow(exp);
};

export const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US") + " " + date.toLocaleTimeString("en-US");
};
