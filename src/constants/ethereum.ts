let ethereum = window.ethereum;
if (window) {
    window.addEventListener("load", () => {
        ethereum = window.ethereum;
    });
}

export default ethereum;
