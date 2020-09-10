import { useContext } from "react";

import { Colors } from "../constants/colors";
import { GlobalContext } from "../context/GlobalContext";

const useColors = () => {
    const { darkMode } = useContext(GlobalContext);
    return {
        ...Colors[darkMode ? "dark" : "light"],
        ...Colors.common
    };
};

export default useColors;
