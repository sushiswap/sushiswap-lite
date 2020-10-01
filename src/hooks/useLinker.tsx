import { useCallback } from "react";
import { Platform } from "react-native";

import { useNavigation } from "@react-navigation/native";

const useWebLinker = (path: string, route: string, target?: string) => {
    return useCallback(() => {
        window.open(path, target);
    }, [path, target]);
};

const useAppLinker = (path: string, route: string, _target?: string) => {
    const { navigate } = useNavigation();
    return useCallback(() => {
        navigate(route);
    }, [route]);
};

export default Platform.OS === "web" ? useWebLinker : useAppLinker;
