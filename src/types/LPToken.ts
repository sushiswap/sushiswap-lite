import { ethers } from "ethers";
import Token from "./Token";

export default interface LPToken {
    address: string;
    decimals: number;
    tokenA: Token;
    tokenB: Token;
    balance: ethers.BigNumber;
}
