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
    useAsyncEffect<number[]>(
        () => {
            return [
                setTimeout(effect, initialTimeout),
                setTimeout(() => addOnBlockListener(eventName, effect), initialTimeout)
            ];
        },
        handles => {
            if (handles) {
                handles.forEach(handle => clearTimeout(handle));
                removeOnBlockListener(eventName);
            }
        },
        inputs
    );
};

export default useDelayedOnBlockEffect;
