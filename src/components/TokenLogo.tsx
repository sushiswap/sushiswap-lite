import React, { useState } from "react";
import { Image, View } from "react-native";

import Token from "../types/Token";

const TokenLogo = (props: { token: Token; disabled?: boolean }) => {
    const [error, setError] = useState(false);
    const placeholder = require("../../assets/empty-token.png");
    return (
        <View
            style={{ width: 27, height: 27, backgroundColor: props.disabled ? "black" : "white", borderRadius: 13.5 }}>
            <Image
                source={error ? placeholder : { uri: props.token.logoURI }}
                onError={() => setError(true)}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    opacity: props.disabled ? 0.25 : 1
                }}
            />
        </View>
    );
};

export default TokenLogo;
