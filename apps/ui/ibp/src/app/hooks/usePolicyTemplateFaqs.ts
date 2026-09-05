import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { endPoints, useApiQuery } from "@ui/ui-lib";
import { AppDispatch, RootState } from "../redux/store";
import { fetchPolicyTemplate } from "../redux/policyTemplateSlice";

export type PolicyFaqItem = {
  id: string;
  question: string;
  answer: string;
  category?: string;
};

/**
 * Aggregates FAQs from the policy templates of every policy the employee has
 * (employeePolicies + enrolledPolicies), normalized and sorted by
 * sequencenumber. Meant to be appended after the company FAQs.
 */
export const usePolicyTemplateFaqs = (): {
  faqs: PolicyFaqItem[];
  loading: boolean;
} => {
  const dispatch = useDispatch<AppDispatch>();
  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id || "";

  // Same queryKey as the dashboard → served from react-query cache, no refetch.
  const { data: policiesData } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: endPoints.employeePolicies(employeeId),
    enabled: Boolean(employeeId),
  });

  const { byPolicyId, loading } = useSelector(
    (state: RootState) => state.policyTemplate,
  );

  const policyIds = useMemo(() => {
    const employeePolicies = policiesData?.data?.employeePolicies ?? [];
    const enrolledPolicies = policiesData?.data?.enrolledPolicies ?? [];
    return Array.from(
      new Set(
        [...employeePolicies, ...enrolledPolicies]
          .map((policy: any) => policy?.policyId)
          .filter((policyId: any) => policyId != null),
      ),
    );
  }, [policiesData]);

  useEffect(() => {
    if (policyIds.length > 0) {
      dispatch(fetchPolicyTemplate(policyIds));
    }
  }, [dispatch, policyIds]);

  const faqs = useMemo<PolicyFaqItem[]>(() => {
    const collected: Array<PolicyFaqItem & { sequence: number; index: number }> =
      [];

    policyIds.forEach((policyId) => {
      const template = byPolicyId?.[String(policyId)];
      const sourceFaqs = template?.config?.faqs;
      if (!Array.isArray(sourceFaqs)) return;

      sourceFaqs.forEach((faq: any, index: number) => {
        const question =
          faq?.question ?? faq?.attributes?.question ?? "";
        const answer = faq?.answer ?? faq?.attributes?.answer ?? "";
        const category = faq?.category ?? faq?.attributes?.category;
        const sequenceRaw =
          faq?.sequencenumber ??
          faq?.sequenceNumber ??
          faq?.attributes?.sequencenumber ??
          faq?.attributes?.sequenceNumber;
        const sequence = Number(sequenceRaw);
        const rawId = faq?.id ?? faq?.attributes?.id ?? index + 1;

        if (typeof question !== "string" || typeof answer !== "string") return;
        if (!question || !answer) return;

        collected.push({
          id: `policy-${policyId}-${rawId}`,
          question,
          answer,
          category: typeof category === "string" ? category : undefined,
          sequence: Number.isFinite(sequence)
            ? sequence
            : Number.MAX_SAFE_INTEGER,
          index: collected.length,
        });
      });
    });

    return collected
      .sort((a, b) =>
        a.sequence !== b.sequence ? a.sequence - b.sequence : a.index - b.index,
      )
      .map(({ id, question, answer, category }) => ({
        id,
        question,
        answer,
        category,
      }));
  }, [byPolicyId, policyIds]);

  return { faqs, loading };
};

export default usePolicyTemplateFaqs;
