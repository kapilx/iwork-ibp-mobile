import { formatDate } from "@ui/ui-lib";
import LoggedIn from "../../assets/svgs/logged-in-icon.svg";
import ConfirmationEmail from "../../assets/svgs/confirmation-icon.svg";
import DownloadedDocument from "../../assets/svgs/downloaded-document-icon.svg";
import ClaimRaised from "../../assets/svgs/claim-raised-icon.svg";
import PolicyEnrollment from "../../assets/svgs/policy-enrolled-icon.svg";
import DownloadedEcard from "../../assets/svgs/downloaded-icon.svg";

export interface ActivityLogItem {
  id: string;
  date: string;
  title: string;
  description: string;
  icon: string;
  referenceId?: string;
  referenceType?: string;
  downloadable?: boolean;
  downloadFileName?: string;
  previewable?: boolean;
  previewLabel?: string;
  metadata?: Record<string, unknown>;
  activityKey?: string;
}

export interface BackendActivity {
  id: string;
  activityKey: string;
  activityDate: string;
  referenceId?: string;
  referenceType?: string;
  meta?: {
    memberName?: string;
    documentType?: string;
    policyNumber?: string;
    policyName?: string;
    activityText?: string;
    browser?: string;
    [key: string]: unknown;
  };
  metadata?: {
    memberName?: string;
    documentType?: string;
    policyNumber?: string;
    policyName?: string;
    activityText?: string;
    browser?: string;
    [key: string]: unknown;
  };
}

export const mapActivityToUI = (activity: BackendActivity): ActivityLogItem | null => {
  const formattedDate = formatDate(activity.activityDate, "DD MMM YYYY [at] hh:mm A");
  const meta = activity.meta ?? activity.metadata;

  const getDocumentDescription = () => {
    const activityText = meta?.activityText;
    if (activityText) return String(activityText);

    const memberName = meta?.memberName;
    const documentType = meta?.documentType;
    const policyNumber = meta?.policyNumber || meta?.policyName;

    if (memberName && policyNumber) {
      return `${
        documentType || "Document"
      } downloaded for ${memberName} (${policyNumber})`;
    }
    if (memberName) {
      return `${documentType || "Document"} downloaded for ${memberName}`;
    }
    if (policyNumber) {
      return `${documentType || "Document"} downloaded (${policyNumber})`;
    }
    if (documentType) {
      return `${documentType} downloaded`;
    }
    return "Document downloaded";
  };

  switch (activity.activityKey) {
    case "ONBOARDED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Onboarded",
        description: "User successfully onboarded",
        icon: PolicyEnrollment,
      };

    case "LOGGED_IN":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Logged in",
        description: `Successful login from ${meta?.browser || "device"}`,
        icon: LoggedIn,
      };

    case "DEPENDENT_ADDED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Dependents added",
        description: "Dependent details saved but enrolment not submitted",
        icon: PolicyEnrollment,
      };

    case "CHOICES_SELECTED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Choices selected",
        description: "Policy options selected but enrolment not submitted",
        icon: PolicyEnrollment,
      };

    case "SUBMITTED_ENROLLMENT":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Enrolment submitted",
        description: "Dependents and policy choices submitted successfully",
        icon: PolicyEnrollment,
      };
    
    case "TICKET_RAISED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Support ticket raised",
        description: `Ticket raised with ID: ${activity.metadata?.ticketId || activity.referenceId}`,
        icon: DownloadedDocument,
      };

    case "DOCUMENT_VIEWED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Document viewed",
        description: getDocumentDescription().replace("downloaded", "viewed"),
        icon: DownloadedDocument,
      };

    case "DOCUMENT_DOWNLOADED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Document downloaded",
        description: getDocumentDescription(),
        icon: DownloadedDocument,
        downloadable: true,
      };

    case "ECARD_DOWNLOADED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "E-card downloaded",
        description: `E-card downloaded for ${meta?.memberName || "member"}`,
        icon: DownloadedEcard,
        downloadable: true,
      };

    case "ECARD_VIEWED": 
      return {
        id: activity.id,
        date: formattedDate,
        title: "E-card viewed",
        description: `E-card viewed for ${meta?.memberName || "member"}`,
        icon: DownloadedEcard,
      };

    case "CLAIM_INITIATED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Claim initiated",
        description: "Claim process started",
        icon: ClaimRaised,
      };

    case "CLAIM_SUBMITTED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Claim submitted",
        description: "Claim submitted successfully",
        icon: ClaimRaised,
      };

    case "CLAIM_TRACKING_VIEWED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Claim tracking viewed",
        description: "User checked claim tracking details",
        icon: ClaimRaised,
      };

    case "ENROLMENT_STATUS_VIEWED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Enrolment status viewed",
        description: "User checked enrolment status",
        icon: PolicyEnrollment,
      };

    case "LIFE_EVENT_ADDITION_SUBMITTED": {
      const dependentNames = typeof meta?.dependentNames === 'string' ? meta.dependentNames : null;
      const lifeEventTitle = typeof meta?.lifeEventTitle === 'string' ? meta.lifeEventTitle : null;
      const descriptionParts = [
        dependentNames ? `${dependentNames} added` : "Dependent added",
        lifeEventTitle ? `through life event: ${lifeEventTitle}` : "through life events",
      ];
      return {
        id: activity.id,
        date: formattedDate,
        title: "Dependent addition submitted",
        description: descriptionParts.join(" "),
        icon: PolicyEnrollment,
      };
    }

    case "LIFE_EVENT_DELETION_SUBMITTED": {
      const dependentNames = typeof meta?.dependentNames === 'string' ? meta.dependentNames : null;
      const lifeEventTitle = typeof meta?.lifeEventTitle === 'string' ? meta.lifeEventTitle : null;
      const descriptionParts = [
        dependentNames ? `${dependentNames} removed` : "Dependent removed",
        lifeEventTitle ? `through life event: ${lifeEventTitle}` : "through life events",
      ];
      return {
        id: activity.id,
        date: formattedDate,
        title: "Dependent deletion submitted",
        description: descriptionParts.join(" "),
        icon: PolicyEnrollment,
      };
    }

    case "CLAIM_SUMMARY_VIEWED":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Claim summary viewed",
        description: "Claim Corner accessed",
        icon: ClaimRaised,
      };

    case "CONFIRMATION_EMAIL_SENT":
    case "INITIAL_ONBOARDING_EMAIL_SENT":
    case "ENROLLMENT_START_EMAIL_SENT":
    case "ENROLLMENT_REMINDER_EMAIL_SENT":
      {
        const policyIds = Array.isArray(meta?.policyIds)
          ? meta.policyIds.filter((policyId) => policyId != null)
          : [];
        const policyCount = policyIds.length;
        const isAutoSubmit = Boolean((meta as any)?.isAutoSubmit);
        const submissionCount =
          typeof (meta as any)?.submissionCount === "number"
            ? (meta as any).submissionCount
            : typeof (meta as any)?.submissionCount === "string"
              ? Number((meta as any).submissionCount)
              : null;
        const referenceNumber =
          typeof (meta as any)?.referenceNumber === "string"
            ? (meta as any).referenceNumber
            : null;
        const mailConfig: Record<
          string,
          { title: string; fallbackDescription: string; previewLabel: string }
        > = {
          CONFIRMATION_EMAIL_SENT: {
            title: isAutoSubmit
              ? "Enrollment auto-submitted confirmation email sent"
              : "Enrolment confirmation email sent",
            fallbackDescription: isAutoSubmit
              ? "Enrollment auto-submitted confirmation email sent to user"
              : "Enrolment confirmation email sent to user",
            previewLabel: isAutoSubmit
              ? "Preview auto-submitted enrollment confirmation email"
              : "Preview enrolment confirmation email",
          },
          INITIAL_ONBOARDING_EMAIL_SENT: {
            title: "Onboarding email sent",
            fallbackDescription: "Onboarding email sent to user",
            previewLabel: "Preview onboarding email",
          },
          ENROLLMENT_START_EMAIL_SENT: {
            title: "Enrollment window open mail",
            fallbackDescription: "Enrollment window open mail sent to user",
            previewLabel: "Preview enrollment window open mail",
          },
          ENROLLMENT_REMINDER_EMAIL_SENT: {
            title: "Enrollment reminder mail",
            fallbackDescription: "Enrollment reminder mail sent to user",
            previewLabel: "Preview enrollment reminder mail",
          },
        };
        const currentMailConfig =
          mailConfig[activity.activityKey] ?? mailConfig.CONFIRMATION_EMAIL_SENT;

      return {
        id: activity.id,
        date: formattedDate,
        title: currentMailConfig.title,
        description:
          activity.activityKey === "CONFIRMATION_EMAIL_SENT" &&
          submissionCount &&
          referenceNumber
            ? `Submission #${submissionCount} | Ref Id - ${referenceNumber}`
            : policyCount > 0
            ? `${currentMailConfig.title} for ${policyCount} ${
                policyCount === 1 ? "policy" : "policies"
              }`
            : currentMailConfig.fallbackDescription,
        icon: ConfirmationEmail,
        referenceId: activity.referenceId,
        referenceType: activity.referenceType,
        previewable: true,
        previewLabel: currentMailConfig.previewLabel,
        metadata:
          meta && typeof meta === "object"
            ? (meta as Record<string, unknown>)
            : undefined,
        activityKey: activity.activityKey,
      };
    }
    case "LOGGED_OUT":
      return {
        id: activity.id,
        date: formattedDate,
        title: "Logged out",
        description: "User logged out of the portal",
        icon: LoggedIn,
      };

    default: {
      const activityText = typeof meta?.activityText === 'string' ? meta.activityText : null;
      if (!activityText || activityText === "User performed an action") {
        return null;
      }
      return {
        id: activity.id,
        date: formattedDate,
        title: "Activity",
        description: activityText ?? "User performed an action",
        icon: LoggedIn,
      };
    }
  }
};
