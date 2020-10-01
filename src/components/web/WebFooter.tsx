import React, { useCallback } from "react";
import { View } from "react-native";

import { Spacing } from "../../constants/dimension";
import FlexView from "../FlexView";
import Text from "../Text";

const WebFooter = () => (
    <View
        // @ts-ignore
        style={{
            position: "fixed",
            bottom: 0,
            margin: Spacing.content
        }}>
        <Text note={true} style={{ marginLeft: 12 }}>
            Built by <Link to={"https://levx.io"} text={"Team LevX"} />
        </Text>
        <FlexView>
            <Link to={"https://github.com/sushiswap-community"} text={"GitHub"} />
            <Link to={"https://twitter.com/LevxApp"} text={"Twitter"} />
            <Link to={"https://discord.gg/Mcdm7v"} text={"Discord"} />
        </FlexView>
    </View>
);

const Link = ({ to, text }) => {
    const onPress = useCallback(() => {
        window.open(to, "_blank");
    }, []);
    return (
        <Text note={true} style={{ textDecorationLine: "underline", marginRight: 8 }} onPress={onPress}>
            {text}
        </Text>
    );
};

export default WebFooter;
