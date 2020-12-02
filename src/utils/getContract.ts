import ERC20 from "@sushiswap/core/build/contracts/ERC20.json";
import IUniswapV2Factory from "@sushiswap/core/build/contracts/IUniswapV2Factory.json";
import IUniswapV2Pair from "@sushiswap/core/build/contracts/IUniswapV2Pair.json";
import IUniswapV2Router02 from "@sushiswap/core/build/contracts/IUniswapV2Router02.json";
import IWETH from "@sushiswap/core/build/contracts/IWETH.json";
import MasterChef from "@sushiswap/core/build/contracts/MasterChef.json";
import SushiBar from "@sushiswap/core/build/contracts/SushiBar.json";
import SushiRoll from "@sushiswap/core/build/contracts/SushiRoll.json";
import OrderBook from "@sushiswap/settlement/deployments/kovan/OrderBook.json";
import Settlement from "@sushiswap/settlement/deployments/mainnet/Settlement.json";
import ZapIn from "@sushiswap/zapper/artifacts/Sushiswap_ZapIn_General_V2.json";
import ZapOut from "@sushiswap/zapper/artifacts/Sushiswap_ZapOut_General_V1.json";
import { ethers } from "ethers";
import LPTokenScanner from "../constants/abi/LPTokenScanner.json";

const CONTRACTS = {
    ERC20,
    IUniswapV2Factory,
    IUniswapV2Pair,
    IUniswapV2Router02,
    IWETH,
    MasterChef,
    SushiBar,
    SushiRoll,
    OrderBook,
    Settlement,
    LPTokenScanner: { abi: LPTokenScanner },
    ZapIn,
    ZapOut
};

const getContract = (name: string, address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) => {
    const contract = CONTRACTS[name];
    return new ethers.Contract(address, contract.abi, signerOrProvider);
};

export default getContract;
