import {apiRequest, endPoints} from "@ui/ui-lib";

export const capitalizeFirst = (str?: string | null): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const handleLogout = async (error: unknown): Promise<void> => {
  const errorData = (error as any)?.response?.data ?? {
    message: "Something went wrong",
  };

  if (errorData?.statusCode === 401) {
    try {      
      // Get user details for logging
      const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
      // Log the logout activity for 401 error
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "LOGGED_OUT",
          activityCategory: "AUTH",
          referenceId: userDetails?.employeeId,
          referenceType: "USER",
          metadata: { reason: "unauthorized_error" },
        },
        headers: { userid: String(userDetails?.employeeId) },
      });
    } catch (logError) {
      console.error("Failed to log 401 logout activity:", logError);
    }
    
    sessionStorage.removeItem("user"); // Remove user from storage
    sessionStorage.removeItem("sessionStartedAt");
    window.location.href = "/landing"; // Navigate to landing page
  } else {
    console.error(
      "Unexpected error:",
      errorData?.message || "Unknown error occurred."
    );
  }
};

export const countDigitsBeforeIndex = (str: string, index: number): number => {
  return str.slice(0, index).replace(/\D/g, "").length;
};

export const findIndexAfterNDigits = (
  formatted: string,
  digitCount: number
): number => {
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count++;
    if (count === digitCount) return i + 1;
  }
  return formatted.length;
};


// Helper function to get features based on policy type
export const getPolicyFeatures = (policyTypeKey: string) => {
    switch (policyTypeKey) {
      case 'POLICY_TYPE_GMC':
      case 'POLICY_TYPE_GMC_TOP-UP':
        return [
          "Hospitalization coverage for employee and dependents",
          "Pre and post hospitalization expenses covered",
          "Day-care procedures included",
          "Cashless facility at network hospitals",
          "Maternity and newborn baby coverage",
          // "Includes maternity benefits (subject to policy terms, if applicable)",
          // "Covers pre-existing diseases as per group policy conditions",
          // "No individual medical tests required for enrollment",
        ];
      case 'POLICY_TYPE_GPA':
        return [
          "Coverage for accidental death and disability",
          "24/7 worldwide coverage",
          "No medical examination required",
          "Financial protection for unexpected accidents",
          "Covers transportation accident and occupational injuries",
          // "Includes occupational and transportation-related injuries",
          // "No medical examination required for enrollment",
          // "Offers lump-sum payout based on the severity of injury or disability",
          // "Helps employees and families manage unexpected financial burdens",
        ];
      case 'POLICY_TYPE_GTL':
        return [
          "Coverage for accidental death and disability",
          "24/7 worldwide coverage",
          "No medical examination required",
          "Financial protection for unexpected accidents",
          "Covers transportation accident and occupational injuries",
          "No medical tests required for most employees",
          // "Easy enrollment with minimal documentation",
          // "Financial security for employee families and dependents",
          // "Employer-sponsored benefit that enhances financial protection",
          ];
      default:
        return ["Policy benefits available"];
    }
  };
