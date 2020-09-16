import { ethers } from "ethers";
import Token from "./Token";

export default interface LPToken extends Token {
    tokenA: Token;
    tokenB: Token;
    totalSupply: ethers.BigNumber;
}
