import React, { useContext } from "react";
import { TouchableHighlight, View } from "react-native";

import { GlobalContext } from "../context/GlobalContext";
import SvgMoon from "./svg/SvgMoon";
import SvgSun from "./svg/SvgSun";

const DarkModeSwitch = props => {
    const { darkMode, setDarkMode } = useContext(GlobalContext);
    const onPress = async () => {
        await setDarkMode(!darkMode);
    };
    return (
        <View style={props.style}>
            <TouchableHighlight onPress={onPress}>
                {darkMode ? (
                    <SvgMoon width={24} height={24} style={{ marginHorizontal: 2 }} />
                ) : (
                    <SvgSun width={30} height={30} />
                )}
            </TouchableHighlight>
        </View>
    );
};

export default DarkModeSwitch;
