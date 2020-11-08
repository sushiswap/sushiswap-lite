import React, { useCallback, useContext } from "react";
import { View } from "react-native";

import Switch from "expo-dark-mode-switch";

import { GlobalContext } from "../context/GlobalContext";

const DarkModeSwitch = props => {
    const { darkMode, setDarkMode } = useContext(GlobalContext);
    const onChange = useCallback(
        async dark => {
            await setDarkMode(dark);
        },
        [setDarkMode]
    );
    return (
        <View style={props.style}>
            <Switch
                value={darkMode}
                onChange={onChange}
                style={{
                    transform: [
                        {
                            scale: 0.75
                        }
                    ]
                }}
            />
        </View>
    );
};

export default DarkModeSwitch;
