import useAsyncEffect from "use-async-effect";

const handles = {};

const useDelayedEffect = (
    effect: (isMounted: () => boolean) => unknown | Promise<unknown>,
    timeout: number,
    inputs?: any[]
) => {
    const key = effect.toString();
    useAsyncEffect<number>(
        () => {
            const handle = setTimeout(effect, timeout);
            handles[key] = handle;
            return handle;
        },
        handle => {
            clearTimeout(handle);
        },
        inputs
    );
};
export default useDelayedEffect;
