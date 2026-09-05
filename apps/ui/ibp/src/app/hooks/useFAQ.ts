import { useEffect, useMemo, useState } from "react";
import { endPoints, setToastMessage, useApiQuery } from "@ui/ui-lib";
import { useDispatch } from "react-redux";

type FAQItem = {
  id: string | number;
  question: string;
  answer: string;
};

type BackendFaqResponse = {
  statusCode: number;
  message: string;
  data: {
    faqs: Array<{
      id: number;
      question: string;
      answer: string;
    }>;
    availableCategories: string[];
  };
};

type UseFaqsProps = {
  employeeId?: string;
  category?: string;
  enabled?: boolean;
};

export const useFaqs = ({
  employeeId,
  category = "All",
  enabled = true,
}: UseFaqsProps) => {
  const dispatch = useDispatch();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const empId = employeeId || userDetails.id || "";

  const apiUrl = useMemo(() => {
    const baseUrl = `${endPoints.faqsList}?employeeId=${empId}`;
    if (category === "All") {
      return baseUrl;
    }
    return `${baseUrl}&category=${encodeURIComponent(category)}`;
  }, [empId, category]);

  const {
    data: backendData,
    isLoading: isBackendLoading,
    error: backendError,
  } = useApiQuery({
    queryKey: ["backendFaqs", empId, category],
    url: apiUrl,
    enabled: enabled && Boolean(empId),
  });

  const backendFaqs: FAQItem[] = useMemo(() => {
    const json = backendData as BackendFaqResponse | undefined;
    if (!json?.data?.faqs) return [];
    return json.data.faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    }));
  }, [backendData]);

  useEffect(() => {
    if (backendFaqs.length) {
      setFaqs(backendFaqs);
    } else {
      setFaqs([]);
    }
  }, [backendFaqs]);
  const isLoading = isBackendLoading;
  const error = backendError;

  useEffect(() => {
    if (error && !faqs.length) {
      dispatch(
        setToastMessage({
          message: error?.message || "Failed to load FAQs",
        }),
      );
    }
  }, [error, faqs.length, dispatch]);

  return {
    faqs,
    isLoading,
    error,
  };
};
