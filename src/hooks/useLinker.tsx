import { useCallback } from "react";
import { Platform } from "react-native";

import { useNavigation } from "@react-navigation/native";

const useLinker = (path: string, route: string, target?: string) => {
    const { navigate } = useNavigation();
    return useCallback(() => {
        if (Platform.OS === "web") {
            window.open(path, target);
        } else {
            navigate(route);
        }
    }, [path, route]);
};

export default useLinker;
