import React, { useContext } from "react";
import { View, ViewStyle } from "react-native";

import { GlobalContext } from "../context/GlobalContext";
import useColors from "../hooks/useColors";
import SvgBackground from "./svg/SvgBackground";
import SvgBackgroundDark from "./svg/SvgBackgroundDark";

const BackgroundImage = ({ style }: { style?: ViewStyle }) => {
    const { darkMode } = useContext(GlobalContext);
    const { background } = useColors();
    const props = {
        width: 1920,
        height: 1920
    };
    return (
        <View
            style={[
                {
                    position: "absolute",
                    width: "100%",
                    aspectRatio: 1,
                    backgroundColor: background
                },
                style
            ]}>
            <View style={{ marginTop: -400, marginLeft: -1000, alignSelf: "center" }}>
                {darkMode ? <SvgBackgroundDark {...props} /> : <SvgBackground {...props} />}
            </View>
        </View>
    );
};

export default BackgroundImage;
