import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import grapesjs, { Editor as GrapesEditor } from 'grapesjs';
import grapesjsPresetNewsletter from 'grapesjs-preset-newsletter';
import 'grapesjs/dist/css/grapes.min.css';
import { protectHandlebarsHtml, restoreHandlebarsHtml } from './handlebarsHtmlProtection';

export interface GrapesJsEmailEditorHandle {
  /** Current content, Handlebars tokens restored — call only on Save. */
  getHtml: () => string;
}

interface GrapesJsEmailEditorProps {
  /** Initial HTML for this mount. Not a controlled prop — GrapesJS owns
   * its own content imperatively once initialized; changing this after
   * mount does nothing (mount a new instance via a `key` change instead,
   * same as the rest of this tab does when switching templates). */
  html: string;
  onDirty: () => void;
  height?: number;
}

/**
 * Visual (WYSIWYG) email editor — GrapesJS with the newsletter preset,
 * wrapped so callers never touch raw HTML directly. Every {{handlebars}}
 * token in `html` is protected (see handlebarsHtmlProtection.ts) before
 * GrapesJS ever parses it, and un-protected again only inside getHtml(),
 * so the imperative handle always returns real, saveable template HTML —
 * GrapesJS itself never sees a bare {{...}} token.
 */
export const GrapesJsEmailEditor = forwardRef<GrapesJsEmailEditorHandle, GrapesJsEmailEditorProps>(
  ({ html, onDirty, height = 520 }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<GrapesEditor | null>(null);
    const tokensRef = useRef<string[]>([]);

    useEffect(() => {
      if (!containerRef.current) return;

      const { protectedHtml, tokens } = protectHandlebarsHtml(html);
      tokensRef.current = tokens;

      const editor = grapesjs.init({
        container: containerRef.current,
        height: `${height}px`,
        width: '100%',
        fromElement: false,
        storageManager: false,
        plugins: [grapesjsPresetNewsletter],
      });

      editor.setComponents(protectedHtml);
      editorRef.current = editor;

      const handleUpdate = () => onDirty();
      editor.on('update', handleUpdate);

      return () => {
        editor.off('update', handleUpdate);
        editor.destroy();
        editorRef.current = null;
      };
      // Intentionally mount-once: this component is remounted via a `key`
      // change on the parent when the selected template/config changes,
      // exactly like the previous editors in this tab — see index.tsx.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      getHtml: () => {
        const editor = editorRef.current;
        if (!editor) return html;
        const exportedFull = `<style>${editor.getCss() ?? ''}</style>\n${editor.getHtml()}`;
        return restoreHandlebarsHtml(exportedFull, tokensRef.current);
      },
    }));

    return <div ref={containerRef} />;
  }
);

GrapesJsEmailEditor.displayName = 'GrapesJsEmailEditor';
