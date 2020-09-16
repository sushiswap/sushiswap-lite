import { ethers } from "ethers";

export default interface Token {
    address: string;
    decimals: number;
    symbol: string;
    logoURI: string;
    balance: ethers.BigNumber;
}
