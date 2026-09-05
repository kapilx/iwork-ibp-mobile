import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

export const usePoliciesFlags = () => {
    const policiesData = useSelector((state: RootState) => state.policyData?.policiesData);

    // A policy whose coverage period has already ended can't take life events
    // (adding/removing dependents) — there's nothing left to enrol them into.
    const isPolicyExpired = (policy: any) => {
        const dueDate = policy?.dueDate;
        if (!dueDate) return false;

        const parsedEndDate = new Date(dueDate);
        if (Number.isNaN(parsedEndDate.getTime())) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        parsedEndDate.setHours(0, 0, 0, 0);

        return parsedEndDate.getTime() < today.getTime();
    };

    const isLifeEventEligiblePolicy = (policy: any) => {
        if (!policy) return false;

        return (
            policy?.policyTypeKey &&
            policy?.isEditable === false &&
            !isPolicyExpired(policy)
        );
    };

    const hasGMCPolicy = useMemo(() => {
        if (!policiesData) return false;

        const { employeePolicies = [], enrolledPolicies = [] } = policiesData;
        const allPolicies = [...employeePolicies, ...enrolledPolicies];

        return allPolicies.some(
            (policy: any) => policy?.policyTypeKey?.includes("POLICY_TYPE_GMC"),
        );
    }, [policiesData]);

    const hasGMCPolicyForLifeEvents = useMemo(() => {
        if (!policiesData) return false;

        const { enrolledPolicies = [] } = policiesData;

        return enrolledPolicies.some((policy: any) => {
            const isGMCPolicy = policy?.policyTypeKey?.includes("POLICY_TYPE_GMC");
            const isTopUpPolicy = policy?.policyTypeKey?.includes("POLICY_TYPE_GMC_TOP-UP");
            const isNonEditable = policy?.isEditable === false;

            return isGMCPolicy && (isNonEditable || isTopUpPolicy) && !isPolicyExpired(policy);
        });
    }, [policiesData]);

    const hasAnyPolicyForLifeEvents = useMemo(() => {
        if (!policiesData) return false;

        const { enrolledPolicies = [] } = policiesData;
        return enrolledPolicies.some((policy: any) => isLifeEventEligiblePolicy(policy));
    }, [policiesData]);

    return { hasGMCPolicy, hasGMCPolicyForLifeEvents, hasAnyPolicyForLifeEvents };
};
