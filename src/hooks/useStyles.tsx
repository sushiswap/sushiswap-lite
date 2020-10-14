import { useCallback, useContext } from "react";
import { ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import { GlobalContext } from "../context/GlobalContext";
import useColors from "./useColors";

const useStyles = () => {
    const { shadow: shadowColor, primary, secondary } = useColors();
    const { darkMode } = useContext(GlobalContext);
    const border = useCallback(
        (color?: string) => ({
            borderColor: color || (darkMode ? secondary : primary),
            borderWidth: 1,
            borderRadius: 4,
            padding: Spacing.small
        }),
        []
    );
    const shadow = () =>
        ({
            borderRadius: Spacing.tiny,
            elevation: Spacing.small,
            shadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            overflow: "visible"
        } as ViewStyle);
    return { border, shadow };
};

export default useStyles;
