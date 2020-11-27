import LPToken from "./LPToken";

export default interface LPTokenWithValue extends LPToken {
    priceUSD: number | null;
    valueUSD: number | null;
}
