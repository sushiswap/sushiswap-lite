import React from "react";

import { EthersContextConsumer, EthersContextProvider } from "./EthersContext";
import { GlobalContextConsumer, GlobalContextProvider } from "./GlobalContext";
import { SwapContextConsumer, SwapContextProvider } from "./SwapContext";

export const ContextProvider = ({ children }) => {
    return (
        <EthersContextProvider>
            <GlobalContextProvider>
                <SwapContextProvider>{children}</SwapContextProvider>
            </GlobalContextProvider>
        </EthersContextProvider>
    );
};

export const ContextConsumer = ({ children }) => {
    return (
        <EthersContextConsumer>
            {ethersContext => (
                <GlobalContextConsumer>
                    {globalContext => (
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
                </GlobalContextConsumer>
            )}
        </EthersContextConsumer>
    );
};
