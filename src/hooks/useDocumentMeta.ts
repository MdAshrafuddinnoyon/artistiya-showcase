import { useEffect } from "react";

type DocumentMeta = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
};

/**
 * Minimal meta manager (no extra deps) for SPA pages.
 * Sets document.title, meta description, and canonical link.
 */
export function useDocumentMeta(meta: DocumentMeta) {
  useEffect(() => {
    if (meta.title) {
      document.title = meta.title;
    }

    if (meta.description) {
      let tag = document.querySelector<HTMLMetaElement>("meta[name='description']");
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", meta.description);
    }

    if (meta.canonicalUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", meta.canonicalUrl);
    }
  }, [meta.title, meta.description, meta.canonicalUrl]);
}
