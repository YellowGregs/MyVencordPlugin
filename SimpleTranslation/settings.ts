import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    targetLanguage: {
        type: OptionType.SELECT,
        description: "Language to translate messages to",
        options: [
            { label: "English", value: "en", default: true },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" },
            { label: "German", value: "de" },
            { label: "Italian", value: "it" },
            { label: "Portuguese", value: "pt" },
            { label: "Russian", value: "ru" },
            { label: "Japanese", value: "ja" },
            { label: "Korean", value: "ko" },
            { label: "Chinese (Simplified)", value: "zh-CN" },
            { label: "Chinese (Traditional)", value: "zh-TW" },
            { label: "Arabic", value: "ar" },
            { label: "Hindi", value: "hi" },
            { label: "Dutch", value: "nl" },
            { label: "Polish", value: "pl" },
            { label: "Turkish", value: "tr" },
            { label: "Swedish", value: "sv" },
            { label: "Danish", value: "da" },
            { label: "Finnish", value: "fi" },
            { label: "Norwegian", value: "no" },
            { label: "Czech", value: "cs" },
            { label: "Greek", value: "el" },
            { label: "Hebrew", value: "he" },
            { label: "Thai", value: "th" },
            { label: "Vietnamese", value: "vi" },
            { label: "Indonesian", value: "id" },
            { label: "Malay", value: "ms" },
            { label: "Ukrainian", value: "uk" },
            { label: "Romanian", value: "ro" },
            { label: "Hungarian", value: "hu" },
            { label: "Bulgarian", value: "bg" },
            { label: "Croatian", value: "hr" },
            { label: "Slovak", value: "sk" },
            { label: "Slovenian", value: "sl" },
            { label: "Lithuanian", value: "lt" },
            { label: "Latvian", value: "lv" },
            { label: "Estonian", value: "et" }
        ]
    }
});
