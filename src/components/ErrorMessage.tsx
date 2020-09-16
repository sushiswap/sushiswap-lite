import React from "react";
import { View } from "react-native";

import { Spacing } from "../constants/dimension";
import MetamaskError from "../types/MetamaskError";
import Text from "./Text";

const ErrorMessage = ({ error }: { error: MetamaskError }) => (
    <View
        style={{
            borderColor: "red",
            borderWidth: 1,
            width: "100%",
            padding: Spacing.tiny,
            marginTop: Spacing.small
        }}>
        {error.code && (
            <Text fontWeight={"bold"} style={{ color: "red", fontSize: 14 }}>
                Error Code {error.code}
            </Text>
        )}
        <Text note={true} style={{ color: "red", fontSize: 14 }}>
            {error.message}
        </Text>
    </View>
);

export default ErrorMessage;
