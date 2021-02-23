import { ethers } from "ethers";

export const MAINNET_PROVIDER = new ethers.providers.AlchemyProvider(
    1,
    __DEV__ ? process.env.MAINNET_API_KEY : "Em65gXMcaJl7JF9ZxcMwa4r5TcrU8wZV"
);
export const KOVAN_PROVIDER = new ethers.providers.AlchemyProvider(
    42,
    __DEV__ ? process.env.KOVAN_API_KEY : "MOX3sLJxKwltJjW6XZ8aBtDpenq-18St"
);
