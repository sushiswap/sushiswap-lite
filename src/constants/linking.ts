import { getStateFromPath } from "@react-navigation/native";

const linking = {
    prefixes: ["https://sushiswap.levx.io"],
    config: {
        screens: {
            Home: "",
            Liquidity: "liquidity",
            Farming: "farming"
        }
    },
    getStateFromPath
};

export default linking;
