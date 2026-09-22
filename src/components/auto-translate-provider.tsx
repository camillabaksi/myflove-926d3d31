import { useEffect } from "react";
import { useLang } from "@/hooks/use-language";
import {
  isTranslatable,
  lookupEnglish,
  onTranslationsReady,
  queueForTranslation,
} from "@/lib/auto-translate";

/**
 * Översätter hela gränssnittet till engelska när språket är "en".
 * Sidor som redan använder `t(...)` påverkas inte – deras text är redan
 * engelsk och lämnas orörd. Allt annat översätts på plats.
 */

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SVG",
  "PATH",
]);

const ATTRS = ["placeholder", "aria-label", "title"] as const;

function skipNode(node: Node): boolean {
  let el: HTMLElement | null =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node.parentElement as HTMLElement | null);
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.("data-no-translate")) return true;
    if (el.isContentEditable) return true;
    el = el.parentElement;
  }
  return false;
}

// Originaltexterna lever kvar mellan språkbyten så att svenska kan återställas
// direkt i sidan, utan omladdning.
const originals = new WeakMap<Node, string>();
const applied = new WeakMap<Node, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();

/** Sätter tillbaka all text och alla attribut som översatts till engelska. */
function restoreSwedish() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  let node: Node | null = document.body;
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const source = originals.get(node);
      if (source !== undefined && node.nodeValue !== source) {
        node.nodeValue = source;
        applied.delete(node);
        originals.delete(node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const store = attrOriginals.get(el);
      if (store) {
        for (const [attr, value] of Object.entries(store)) {
          el.setAttribute(attr, value);
        }
        attrOriginals.delete(el);
      }
    }
    node = walker.nextNode();
  }
}

export default function AutoTranslateProvider() {
  const { lang } = useLang();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (lang !== "en") {
      restoreSwedish();
      // Sent inkommande React-renderingar kan hinna före: gör ett extra pass.
      const again = window.setTimeout(restoreSwedish, 120);
      return () => window.clearTimeout(again);
    }

    const translateTextNode = (node: Text) => {
      if (skipNode(node)) return;
      const current = node.nodeValue ?? "";
      if (applied.get(node) === current) return;
      const source = originals.get(node) ?? current;
      if (!isTranslatable(source)) return;

      const leading = source.match(/^\s*/)?.[0] ?? "";
      const trailing = source.match(/\s*$/)?.[0] ?? "";
      const core = source.trim();

      const en = lookupEnglish(core);
      if (!en) {
        originals.set(node, source);
        queueForTranslation(core);
        return;
      }
      if (en === core) return;
      const next = `${leading}${en}${trailing}`;
      originals.set(node, source);
      node.nodeValue = next;
      applied.set(node, next);
    };

    const translateAttrs = (el: Element) => {
      if (skipNode(el)) return;
      for (const attr of ATTRS) {
        const value = el.getAttribute(attr);
        if (!value) continue;
        const store = attrOriginals.get(el) ?? {};
        const source = store[attr] ?? value;
        if (!isTranslatable(source)) continue;
        const en = lookupEnglish(source.trim());
        if (!en) {
          store[attr] = source;
          attrOriginals.set(el, store);
          queueForTranslation(source.trim());
          continue;
        }
        if (en === source || en === value) continue;
        store[attr] = source;
        attrOriginals.set(el, store);
        el.setAttribute(attr, en);
      }
    };

    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) {
        translateTextNode(root as Text);
        return;
      }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      const el = root as Element;
      if (skipNode(el)) return;
      translateAttrs(el);
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let node = walker.nextNode();
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text);
        else translateAttrs(node as Element);
        node = walker.nextNode();
      }
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        walk(document.body);
      });
    };

    schedule();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") {
          translateTextNode(record.target as Text);
        } else if (record.type === "attributes") {
          translateAttrs(record.target as Element);
        } else {
          record.addedNodes.forEach((n) => walk(n));
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRS],
    });

    const off = onTranslationsReady(schedule);

    return () => {
      observer.disconnect();
      off();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [lang]);

  return null;
}
