import { ViewStyle } from "react-native";

import { Spacing } from "../constants/dimension";
import useColors from "./useColors";

const useStyles = () => {
    const { shadow: shadowColor } = useColors();
    const shadow: ViewStyle = {
        borderRadius: Spacing.tiny,
        elevation: Spacing.small,
        shadowColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        overflow: "visible"
    };
    return { shadow };
};

export default useStyles;
