import { ethers } from "ethers";

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
        : text === "" || text.replaceAll("0", "").replaceAll(".", "") === "";
