import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { GrapesJsEmailEditor, GrapesJsEmailEditorHandle } from './GrapesJsEmailEditor';
import { PaneLabel, PreviewFrame, SourcePane, SplitView } from './grapesJsEditorStyles';

export interface GrapesJsSplitEditorHandle {
  /** Current content, Handlebars tokens restored — call only on Save. */
  getHtml: () => string;
}

interface GrapesJsSplitEditorProps {
  /** Initial HTML for this mount — not a controlled prop, same as
   * GrapesJsEmailEditor underneath. Remount via a `key` change on the
   * parent when the underlying content should reset (new template/config
   * loaded, reset-to-default, etc.). */
  html: string;
  canEdit: boolean;
  onDirty: () => void;
  height?: number;
}

/**
 * The "GrapesJS edit pane + Live Preview pane, side by side" unit — the one
 * piece of UI this whole feature keeps coming back to needing in more than
 * one place (the per-company/domain override editor, and now the general
 * Template Editor's email-channel body editor). Encapsulates:
 * - The GrapesJS visual editor (left) via GrapesJsEmailEditor.
 * - A read-only Live Preview iframe (right) that mirrors it, debounced.
 * - The live-preview iframe *remount* fix: mutating an already-mounted
 *   iframe's `srcDoc` prop is unreliable across browsers (some engines only
 *   honor it on the iframe's initial parse) — this is why the preview
 *   pane's `key` bumps on every real content change instead of just
 *   updating `srcDoc` on a persisting DOM node. This was the root cause of
 *   an earlier "live preview not updating" bug; don't remove the `key`.
 */
export const GrapesJsSplitEditor = forwardRef<GrapesJsSplitEditorHandle, GrapesJsSplitEditorProps>(
  ({ html, canEdit, onDirty, height = 520 }, ref) => {
    const editorRef = useRef<GrapesJsEmailEditorHandle>(null);
    const [previewHtml, setPreviewHtml] = useState(html);
    const [previewVersion, setPreviewVersion] = useState(0);
    const [isDirty, setIsDirty] = useState(false);

    const setPreview = (nextHtml: string) => {
      setPreviewHtml(nextHtml);
      setPreviewVersion((v) => v + 1);
    };

    // Resets the preview whenever the caller hands us genuinely new initial
    // content (e.g. a different template loaded without a full remount).
    useEffect(() => {
      setPreview(html);
      setIsDirty(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [html]);

    const handleDirty = () => {
      setIsDirty(true);
      onDirty();
    };

    useEffect(() => {
      if (!isDirty) return;
      const timer = setTimeout(() => {
        if (editorRef.current) setPreview(editorRef.current.getHtml());
      }, 400);
      return () => clearTimeout(timer);
      // Re-arms on every dirty-flip; isDirty itself doesn't change again
      // until the next reset, so this debounces naturally against
      // GrapesJS's own event frequency rather than firing once and
      // stopping.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDirty]);

    useImperativeHandle(ref, () => ({
      getHtml: () => editorRef.current?.getHtml() ?? html,
    }));

    return (
      <SplitView>
        <SourcePane>
          <PaneLabel>{canEdit ? 'Edit Email' : 'Email (view only)'}</PaneLabel>
          {canEdit ? (
            <GrapesJsEmailEditor ref={editorRef} html={html} onDirty={handleDirty} height={height} />
          ) : (
            <PreviewFrame title="Email (view only)" srcDoc={html} sandbox="" height={height} />
          )}
        </SourcePane>
        <SourcePane>
          <PaneLabel>Live Preview</PaneLabel>
          {/* sandbox="" (no flags) — renders the template's own HTML/CSS
              exactly as an email client roughly would, with scripts
              disabled and its inline <style> block scoped to the iframe's
              own document. {{handlebars}} placeholders show as literal
              text, same as they would unrendered in an email client
              preview. height matches the edit pane's own height (above) so
              both sides of the split end at the same point. */}
          <PreviewFrame key={previewVersion} title="Email preview" srcDoc={previewHtml} sandbox="" height={height} />
        </SourcePane>
      </SplitView>
    );
  }
);

GrapesJsSplitEditor.displayName = 'GrapesJsSplitEditor';
