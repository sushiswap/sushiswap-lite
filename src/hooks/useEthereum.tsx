let ethereum = window.ethereum;
if (window) {
    window.addEventListener("load", () => {
        ethereum = window.ethereum;
    });
}

const useEthereum = () => {
    return ethereum;
};

export default useEthereum;
