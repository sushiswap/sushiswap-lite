import React from "react";

import { EthersContextConsumer, EthersContextProvider } from "./EthersContext";
import { GlobalContextConsumer, GlobalContextProvider } from "./GlobalContext";
import { SwapContextConsumer, SwapContextProvider } from "./SwapContext";

export const ContextProvider = ({ children }) => {
    return (
        <GlobalContextProvider>
            <EthersContextProvider>
                <SwapContextProvider>{children}</SwapContextProvider>
            </EthersContextProvider>
        </GlobalContextProvider>
    );
};

export const ContextConsumer = ({ children }) => {
    return (
        <GlobalContextConsumer>
            {globalContext => (
                <EthersContextConsumer>
                    {ethersContext => (
                        <SwapContextConsumer>
                            {swapContext =>
                                children({
                                    ...globalContext,
                                    ...ethersContext,
                                    ...swapContext
                                })
                            }
                        </SwapContextConsumer>
                    )}
                </EthersContextConsumer>
            )}
        </GlobalContextConsumer>
    );
};
