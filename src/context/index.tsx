import React from "react";

import { EthersContextConsumer, EthersContextProvider } from "./EthersContext";
import { GlobalContextConsumer, GlobalContextProvider } from "./GlobalContext";

export const ContextProvider = ({ children }) => {
    return (
        <GlobalContextProvider>
            <EthersContextProvider>{children}</EthersContextProvider>
        </GlobalContextProvider>
    );
};

export const ContextConsumer = ({ children }) => {
    return (
        <GlobalContextConsumer>
            {globalContext => (
                <EthersContextConsumer>
                    {ethersContext =>
                        children({
                            ...globalContext,
                            ...ethersContext
                        })
                    }
                </EthersContextConsumer>
            )}
        </GlobalContextConsumer>
    );
};
