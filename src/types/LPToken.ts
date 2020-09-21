import { ethers } from "ethers";
import Token from "./Token";

export default interface LPToken extends Token {
    id?: number;
    tokenA: Token;
    tokenB: Token;
    totalSupply?: ethers.BigNumber;
    totalDeposited?: ethers.BigNumber;
    amountDeposited?: ethers.BigNumber;
    pendingSushi?: ethers.BigNumber;
}
