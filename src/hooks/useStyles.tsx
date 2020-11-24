import { useCallback } from "react";
import { ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "./useColors";

const useStyles = () => {
    const { shadow: shadowColor, borderDark } = useColors();
    const border = useCallback(
        (attrs?: { color?: string; radius?: number }) => ({
            borderColor: attrs?.color || borderDark,
            borderWidth: 1,
            borderRadius: attrs?.radius || 8,
            padding: Spacing.small
        }),
        []
    );
    const shadow = () =>
        ({
            borderRadius: Spacing.tiny,
            elevation: Spacing.small,
            shadowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
            overflow: "visible"
        } as ViewStyle);
    return { border, shadow };
};

export default useStyles;
