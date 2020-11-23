import React from "react";
import { View } from "react-native";

import { Spacing } from "../../constants/dimension";
import Column from "../Column";
import SocialIcons from "../SocialIcons";
import Text from "../Text";

const WebFooter = () => (
    <Column noTopMargin={true}>
        <View
            style={{
                width: "100%",
                padding: Spacing.normal
            }}>
            <SocialIcons />
            <Text note={true} style={{ marginTop: Spacing.tiny, textAlign: "center", width: "100%" }}>
                Built with ❤️ by SushiSwap
            </Text>
        </View>
    </Column>
);

export default WebFooter;
