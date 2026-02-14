import "./styles.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { classNameFactory } from "@utils/css";
import { Devs } from "@utils/constants";
import { classes } from "@utils/misc";
import definePlugin, { IconComponent, PluginNative } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { ChannelStore, Menu, showToast, Toasts, useEffect, useState } from "@webpack/common";

import { settings } from "./settings";

const cl = classNameFactory("vc-simple-translate-");
const Native = VencordNative.pluginHelpers.SimpleTranslate as PluginNative<typeof import("./native")>;

interface TranslationValue {
    source: string;
    text: string;
}

const translation_cache = new Map<string, TranslationValue>();
const translation_setters = new Map<string, (v: TranslationValue | undefined) => void>();

const TranslateIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 96 960 960"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
        >
            <path fill="currentColor" d="m475 976 181-480h82l186 480h-87l-41-126H604l-47 126h-82Zm151-196h142l-70-194h-2l-70 194Zm-466 76-55-55 204-204q-38-44-67.5-88.5T190 416h87q17 33 37.5 62.5T361 539q45-47 75-97.5T487 336H40v-80h280v-80h80v80h280v80H567q-22 69-58.5 135.5T419 598l98 99-30 81-127-122-200 200Z" />
        </svg>
    );
};

function DismissButton({ on_dismiss }: { on_dismiss: () => void; }) {
    return (
        <button
            onClick={on_dismiss}
            className={cl("dismiss")}
        >
            Dismiss
        </button>
    );
}

function TranslationAccessory({ message }: { message: Message; }) {
    const [translation, set_translation] = useState<TranslationValue | undefined>();

    useEffect(() => {
        if ((message as any).vencordEmbeddedBy) return;

        translation_setters.set(message.id, set_translation);

        return () => void translation_setters.delete(message.id);
    }, [message.id]);

    if (!translation) return null;

    return (
        <div className={cl("accessory")}>
            <TranslateIcon width={16} height={16} className={cl("accessory-icon")} />
            <span className={cl("text")}>{translation.text}</span>
            <br />
            <span className={cl("accessory-info")}>
                (from {translation.source} · <DismissButton on_dismiss={() => set_translation(undefined)} />)
            </span>
        </div>
    );
}

function handle_translate(msg_id: string, data: TranslationValue) {
    translation_setters.get(msg_id)?.(data);
}

function get_lang_name(code: string): string {
    const names: Record<string, string> = {
        en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
        pt: "Portuguese", ru: "Russian", ja: "Japanese", ko: "Korean", zh: "Chinese",
        "zh-CN": "Chinese (Simplified)", "zh-TW": "Chinese (Traditional)",
        ar: "Arabic", hi: "Hindi", nl: "Dutch", pl: "Polish", tr: "Turkish",
        sv: "Swedish", da: "Danish", fi: "Finnish", no: "Norwegian", cs: "Czech",
        el: "Greek", he: "Hebrew", th: "Thai", vi: "Vietnamese", id: "Indonesian",
        ms: "Malay", uk: "Ukrainian", ro: "Romanian", hu: "Hungarian", bg: "Bulgarian",
        hr: "Croatian", sk: "Slovak", sl: "Slovenian", lt: "Lithuanian", lv: "Latvian",
        et: "Estonian", auto: "Auto-detected"
    };

    return names[code] || code.toUpperCase();
}

async function google_translate(text: string, target: string): Promise<TranslationValue | null> {
    try {
        const url = new URL("https://translate.googleapis.com/translate_a/single");
        url.searchParams.set("client", "gtx");
        url.searchParams.set("sl", "auto");
        url.searchParams.set("tl", target);
        url.searchParams.set("dt", "t");
        url.searchParams.set("q", text);

        const { status, data: response_text } = await Native.translate(url.toString());

        if (status !== 200) {
            console.error("[SimpleTranslate] Error:", status);
            return null;
        }

        const data = JSON.parse(response_text);
        
        if (!data?.[0] || !Array.isArray(data[0])) {
            return null;
        }

        const translated = data[0].map((item: any[]) => item[0]).join("");
        const detected = data[2] || "unknown";

        return {
            source: get_lang_name(detected),
            text: translated
        };
    } catch (e) {
        console.error("[SimpleTranslate] Exception:", e);
        return null;
    }
}

async function translate(text: string, target: string): Promise<TranslationValue> {
    const cache_key = `${text}:${target}`;
    const cached = translation_cache.get(cache_key);
    
    if (cached) return cached;

    try {
        const result = await google_translate(text, target);
        if (result) {
            translation_cache.set(cache_key, result);
            if (translation_cache.size > 100) {
                const first_key = translation_cache.keys().next().value;
                translation_cache.delete(first_key);
            }
            return result;
        }

        throw new Error("Translation failed");
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[SimpleTranslate] Error:", e);
        showToast(`Translation failed: ${msg}`, Toasts.Type.FAILURE);
        throw e;
    }
}

const msg_ctx: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    const content = get_content(message);
    if (!content) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.splice(group.findIndex(c => c?.props?.id === "copy-text") + 1, 0, (
        <Menu.MenuItem
            id="vc-simple-translate"
            label="Translate"
            icon={TranslateIcon}
            action={async () => {
                const trans = await translate(content, settings.store.targetLanguage);
                handle_translate(message.id, trans);
            }}
        />
    ));
};

function get_content(message: Message) {
    return message.content
        || message.messageSnapshots?.[0]?.message.content
        || message.embeds?.find(embed => embed.type === "auto_moderation_message")?.rawDescription || "";
}

export default definePlugin({
    name: "SimpleTranslate",
    description: "Translate messages with Google Translate",
    authors: [Devs.YellowGreg],
    
    target: "DESKTOP",
    
    settings,
    contextMenus: {
        "message": msg_ctx
    },

    renderMessageAccessory: props => <TranslationAccessory message={props.message} />,

    messagePopoverButton: {
        icon: TranslateIcon,
        render(message: Message) {
            const content = get_content(message);
            if (!content) return null;

            return {
                label: "Translate",
                icon: TranslateIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async () => {
                    const trans = await translate(content, settings.store.targetLanguage);
                    handle_translate(message.id, trans);
                }
            };
        }
    }
});
