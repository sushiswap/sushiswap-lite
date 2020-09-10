import { ethers } from "ethers";
import Token from "../model/Token";

export const ETH: Token = {
    address: ethers.constants.AddressZero,
    decimals: 18,
    symbol: "ETH",
    logoURI: "/images/tokens/ETH.png",
    balance: ethers.BigNumber.from(0)
};
