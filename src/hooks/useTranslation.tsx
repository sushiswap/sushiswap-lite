import { useContext } from "react";

import i18n from "i18n-js";
import { GlobalContext } from "../context/GlobalContext";

const useTranslation = () => {
    const { locale } = useContext(GlobalContext);
    i18n.translations = {
        en: require("../constants/strings/en.json"),
        zh: require("../constants/strings/zh.json"),
        ko: require("../constants/strings/ko.json"),
        fr: require("../constants/strings/fr.json"),
        es: require("../constants/strings/es.json"),
        jp: require("../constants/strings/jp.json")
    };
    i18n.locale = locale;
    i18n.defaultLocale = "en-US";
    i18n.fallbacks = true;
    return i18n.t;
};

export default useTranslation;
