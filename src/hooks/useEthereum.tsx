import { useState } from "react";

import { EventType, Listener } from "@ethersproject/abstract-provider";
import useAsyncEffect from "use-async-effect";

const useEthereum = () => {
    const [ethereum, setEthereum] = useState<Ethereum | null>(null);
    useAsyncEffect(async () => {
        setEthereum(await detectEthereumProvider());
    });
    return ethereum;
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
    }
}

/**
 * https://github.com/MetaMask/detect-provider/blob/main/src/index.ts
 *
 * Returns a Promise that resolves to the value of window.ethereum if it is
 * set within the given timeout, or null.
 * The Promise will not reject, but an error will be thrown if invalid options
 * are provided.
 *
 * @param options - Options bag.
 * @param options.mustBeMetaMask - Whether to only look for MetaMask providers.
 * Default: false
 * @param options.silent - Whether to silence console errors. Does not affect
 * thrown errors. Default: false
 * @param options.timeout - Milliseconds to wait for 'ethereum#initialized' to
 * be dispatched. Default: 3000
 * @returns A Promise that resolves with the Provider if it is detected within
 * given timeout, otherwise null.
 */
function detectEthereumProvider({
    mustBeMetaMask = false,
    silent = false,
    timeout = 3000
} = {}): Promise<Ethereum | null> {
    let handled = false;

    // tslint:disable-next-line:max-func-body-length
    return new Promise(resolve => {
        if (window.ethereum) {
            handleEthereum();
        } else {
            window.addEventListener("ethereum#initialized", handleEthereum, { once: true });

            setTimeout(() => {
                handleEthereum();
            }, timeout);
        }

        function handleEthereum() {
            if (handled) {
                return;
            }
            handled = true;

            window.removeEventListener("ethereum#initialized", handleEthereum);

            const { ethereum } = window;

            if (ethereum && (!mustBeMetaMask || ethereum.isMetaMask)) {
                resolve(ethereum);
            } else {
                const message =
                    mustBeMetaMask && ethereum
                        ? "Non-MetaMask window.ethereum detected."
                        : "Unable to detect window.ethereum.";

                // tslint:disable-next-line:no-console
                if (!silent) console.error("@metamask/detect-provider:", message);
                resolve(null);
            }
        }
    });
}

export default useEthereum;
