import React from "react";

import { EthersContextConsumer, EthersContextProvider } from "./EthersContext";
import { GlobalContextConsumer, GlobalContextProvider } from "./GlobalContext";

export const ContextProvider = ({ children }) => {
    return (
        <EthersContextProvider>
            <GlobalContextProvider>{children}</GlobalContextProvider>
        </EthersContextProvider>
    );
};

export const ContextConsumer = ({ children }) => {
    return (
        <EthersContextConsumer>
            {ethersContext => (
                <GlobalContextConsumer>
                    {globalContext =>
                        children({
                            ...globalContext,
                            ...ethersContext
                        })
                    }
                </GlobalContextConsumer>
            )}
        </EthersContextConsumer>
    );
};
