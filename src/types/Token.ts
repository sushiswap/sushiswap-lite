import { ethers } from "ethers";

export default interface Token {
    name: string;
    address: string;
    decimals: number;
    symbol: string;
    logoURI: string;
    balance: ethers.BigNumber;
}
