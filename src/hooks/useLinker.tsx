import { useCallback } from "react";
import { Platform } from "react-native";
import { useHistory } from "react-router-dom";

import { useNavigation } from "@react-navigation/native";

const useWebLinker = (path: string, route: string, target?: string) => {
    const history = useHistory();
    return useCallback(() => {
        if (target) {
            window.open(path, target);
        } else {
            history.push(path);
        }
    }, [path, target]);
};

const useAppLinker = (path: string, route: string, _target?: string) => {
    const { navigate } = useNavigation();
    return useCallback(() => {
        navigate(route);
    }, [route]);
};

export default Platform.OS === "web" ? useWebLinker : useAppLinker;
