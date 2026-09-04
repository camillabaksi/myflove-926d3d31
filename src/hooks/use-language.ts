import { useCallback } from "react";
import { useCloudSyncedStorage } from "@/lib/cloud-storage";
import { LANGUAGE_KEY, formatDate, localeFor, translate, type Lang } from "@/lib/i18n";

/**
 * Språkvalet följer kontot mellan enheter, precis som namnet.
 * `t()` tar den svenska källtexten och ger engelska när språket är "en".
 */
export function useLang() {
  const [lang, setLang] = useCloudSyncedStorage<Lang>(LANGUAGE_KEY, "sv");
  const safeLang: Lang = lang === "en" ? "en" : "sv";

  const t = useCallback((text: string) => translate(text, safeLang), [safeLang]);
  const fmtDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions) =>
      formatDate(date, safeLang, options),
    [safeLang],
  );

  return { lang: safeLang, setLang, t, locale: localeFor(safeLang), formatDate: fmtDate };
}
