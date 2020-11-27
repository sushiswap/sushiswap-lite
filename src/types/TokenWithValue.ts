import Token from "./Token";

export default interface TokenWithValue extends Token {
    priceUSD: number | null;
    valueUSD: number | null;
}
