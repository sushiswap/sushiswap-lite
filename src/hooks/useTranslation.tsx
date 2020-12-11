import * as Localization from "expo-localization";

import i18n from "i18n-js";

const useTranslation = () => {
    i18n.translations = {
        en: require("../constants/strings/en.json")
    };
    i18n.locale = Localization.locale;
    i18n.defaultLocale = "en-US";
    i18n.fallbacks = true;
    return i18n.t;
};

export default useTranslation;
