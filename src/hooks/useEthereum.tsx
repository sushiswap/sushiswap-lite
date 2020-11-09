import { EventType, Listener } from "@ethersproject/abstract-provider";

const useEthereum = () => {
    return window.ethereum;
};

interface JsonRPCRequest {
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
}

interface JsonRPCResponse {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: string;
}

interface Callback<ResultType> {
    (error: Error): void;
    (error: null, val: ResultType): void;
}

interface RequestArguments {
    method: string;
    params?: unknown[] | object;
}

interface Ethereum {
    chainId: string;
    isMetaMask: boolean;
    send(payload: any, callback: any): any;
    send(payload: JsonRPCRequest, callback: Callback<JsonRPCResponse>): any;
    request(args: RequestArguments): Promise<any>;
    on(eventName: EventType, listener: Listener);
    off(eventName: EventType, listener: Listener);
}

declare global {
    interface Window {
        ethereum?: Ethereum;
        web3?: {
            currentProvider?: Ethereum;
        };
    }
}

export default useEthereum;
