import { useContext } from "react";

import useAsyncEffect from "use-async-effect";
import { EthersContext, OnBlockListener } from "../context/EthersContext";

const useDelayedOnBlockEffect = (
    effect: OnBlockListener,
    getEventName: () => string,
    inputs?: any[],
    initialTimeout = 500
) => {
    const { addOnBlockListener, removeOnBlockListener } = useContext(EthersContext);
    const eventName = getEventName();
    useAsyncEffect<number>(
        () => {
            const handle = setTimeout(effect, initialTimeout);
            addOnBlockListener(eventName, effect);
            return handle;
        },
        handle => {
            if (handle) {
                clearTimeout(handle);
                removeOnBlockListener(eventName);
            }
        },
        inputs
    );
};

export default useDelayedOnBlockEffect;
