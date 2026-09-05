import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchPolicyTemplate } from "../redux/policyTemplateSlice";

export type PolicyNote = { id: string; text: string };

/**
 * Reads the Strapi policy-template `policyNotes` list for a single policy.
 * Each note carries its own `showNote` toggle — a note is surfaced only when
 * that toggle is on AND the text is non-empty, so switching a note off hides
 * it without the author having to delete their copy.
 */
export const usePolicyNote = (
  policyId?: string | number | null,
): { notes: PolicyNote[] } => {
  const dispatch = useDispatch<AppDispatch>();
  const byPolicyId = useSelector(
    (state: RootState) => state.policyTemplate.byPolicyId,
  );

  const key = policyId == null ? "" : String(policyId);
  // Policies with no Strapi template never land in byPolicyId, so the cache
  // check alone would re-dispatch every time a sibling policy's fetch settles.
  const attemptedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (key && !byPolicyId?.[key] && !attemptedRef.current.has(key)) {
      attemptedRef.current.add(key);
      dispatch(fetchPolicyTemplate(key));
    }
  }, [dispatch, key, byPolicyId]);

  return useMemo(() => {
    const raw = (byPolicyId?.[key]?.config as any)?.policyNotes;
    if (!Array.isArray(raw)) return { notes: [] };

    const notes = raw.reduce<PolicyNote[]>((acc, item: any, index: number) => {
      const source = item?.attributes ?? item ?? {};
      const text = typeof source.text === "string" ? source.text.trim() : "";
      if (source.showNote !== true || !text) return acc;
      acc.push({ id: `policy-note-${key}-${item?.id ?? index}`, text });
      return acc;
    }, []);

    return { notes };
  }, [byPolicyId, key]);
};

export default usePolicyNote;
