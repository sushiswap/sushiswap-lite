import { ethers } from "ethers";

export const formatBalance = (value: ethers.BigNumberish, unit: number, maxDecimals: number = 0) => {
    const formatted = ethers.utils.formatUnits(value, unit);
    if (maxDecimals > 0) {
        const split = formatted.split(".");
        if (split.length > 1) {
            return split[0] + "." + split[1].substr(0, maxDecimals);
        }
    }
    return formatted;
};

export const parseBalance = (value: string, unit: number) => {
    return ethers.utils.parseUnits(value || "0", unit);
};
