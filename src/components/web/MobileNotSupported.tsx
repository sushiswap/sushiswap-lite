import React from "react";
import { Image, View } from "react-native";

import { Spacing } from "../../constants/dimension";
import useColors from "../../hooks/useColors";
import SocialIcons from "../SocialIcons";
import Text from "../Text";
import { Title } from "./WebHeader";

const MobileNotSupported = () => {
    const { background } = useColors();
    return (
        <View
            style={{
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: background,
                width: "100%",
                minHeight: "100%",
                padding: Spacing.normal
            }}>
            <Image
                source={require("../../../assets/sushiswap.jpg")}
                style={{ width: 192, height: 192, marginBottom: Spacing.normal }}
            />
            <Title />
            <Text style={{ marginTop: Spacing.normal }}>Mobile devices not supported yet.</Text>
            <SocialIcons />
        </View>
    );
};

export default MobileNotSupported;
