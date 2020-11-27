import { ethers } from "ethers";
import Token from "./Token";

export default interface LPToken extends Token {
    id?: number;
    tokenA: Token;
    tokenB: Token;
    totalSupply: ethers.BigNumber;
    amountDeposited?: ethers.BigNumber;
    pendingSushi?: ethers.BigNumber;
    sushiRewardedPerYear?: ethers.BigNumber;
    apy?: number;
    totalValueUSD?: number;
    multiplier?: number;
}
