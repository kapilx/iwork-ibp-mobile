import React, { useMemo, useState } from "react";
import {
  FooterContainer,
  FooterInner,
  LogoSection,
  SectionDivider,
  ContentSection,
  FooterTextStack,
  FooterLinks,
  FooterText,
  FooterCompanyName,
  FooterSubText,
  FooterLink,
  IndiaImage,
} from "./styles";
import MarkDownRenderer from "../../common/MarkDownRenderer";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import IMAGE_INSURER from "../../assets/pngs/iirm-new-logo.png";
import { headerLogoMap } from "../Header";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";

const Footer: React.FC = () => {
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [selectedMarkdown, setSelectedMarkdown] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");
  const { data: companyTemplate } = useSelector(
    (state: RootState) => state.companyTemplate,
  );
  const { country: companyConfigCountry } = useCompanyConfig();

  const footerConfig = companyTemplate?.config?.footer ?? null;

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const countryName = String(userDetails?.country || companyConfigCountry || "");
  const countryKey = countryName.toLowerCase();
  const footerLogoSrc = headerLogoMap[countryKey] || IMAGE_INSURER;
  const footerLogoAlt = `${countryName || "India"} Insure Logo`;

  const companyName = footerConfig?.companyName || "India Insure Risk Management & Insurance Broking Private Limited";
  const license = footerConfig?.license || "Composite Broker IRDA Licence No. 101•Valid till 29.01.2027•CIN No: U67120TG1999PTC031412";
  const copyright = footerConfig?.copyright || "Copyright © 2026.";

  const normalizeFooterText = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      return value
        .map((item) =>
          typeof item?.text === "string" ? item.text.trim() : "",
        )
        .filter(Boolean)
        .join("\n\n");
    }
    return "";
  };

  const footerMarkdown = useMemo(
    () => ({
      terms:
        normalizeFooterText(footerConfig?.termsAndConditions) ||
        "**Terms & Conditions**\n\nBy accessing and using this portal, you agree to comply with the following terms:\n\n1. This portal is intended solely for authorized employees and eligible dependents.\n2. All policy information displayed is subject to insurer terms and master policy conditions.\n3. The portal provides information facilitation only and does not override policy documents issued by the insurance company.\n4. Users are responsible for maintaining confidentiality of login credentials.\n5. Any misuse, unauthorized access, or fraudulent activity may lead to suspension of access and legal action.\n6. The organization reserves the right to modify portal features, enrolment rules, or policy display at any time without prior notice.\n7. Claims approval, rejection, or settlement is at the sole discretion of the insurer/TPA.\n8. In case of discrepancies, the Master Policy Document shall prevail.",
      privacy:
        normalizeFooterText(footerConfig?.privacyPolicy) ||
        "**Privacy Policy**\n\n1. We value your privacy and are committed to protecting your personal information.\n\n2. The portal collects personal, employment, and dependent information solely for policy administration and insurance processing purposes.\n\n3. Information may be shared with insurers, TPAs, and authorized service providers for enrolment, claims, and policy servicing.\n\n4. We implement appropriate technical and organizational security measures to safeguard your data.\n\n5. Personal data is retained only for as long as required for policy, legal, and compliance purposes.\n\n6. Users have the right to request correction of inaccurate personal information.\n\n7. Sensitive information such as health data is processed strictly for insurance-related purposes and in compliance with applicable data protection laws.\n\n8. The portal may use cookies for session management and performance improvement.",
      grievance:
        normalizeFooterText(footerConfig?.reportGrievance) ||
        "**Report Grievance**\n\nIf you have any concerns regarding enrolment, claims, policy details, or portal functionality, you may raise a grievance through the following channels:\n\n- 📩 Email: support@IIRM.com  \n- 📞 Helpline: +91-XXXXXXXXXX  \n\n---\n\n- 🖥 Portal: Navigate to “Support / Grievance” section and submit your request  \n\n---\n\n**Grievance Process**\n\n1. Submit your complaint with relevant details and supporting documents.  \n\n2. You will receive a ticket/reference number for tracking.  \n\n3. Our support team will respond within 2–3 working days.  \n\n4. If unresolved, the issue may be escalated to HR or the insurer grievance cell.  \n\n5. Final resolution timelines may vary depending on insurer/TPA processing.",
    }),
    [footerConfig],
  );

  const handleFooterLinkClick = (link: string) => {
    // Open external URLs
    const urls: Record<string, string> = {
      privacy: "https://indiainsure.iirmholdings.in/privacy-policy/",
      grievance: "https://indiainsure.iirmholdings.in/report-grievance/",
      terms: "https://indiainsure.iirmholdings.in/terms-and-conditions/"
    };
    
    const url = urls[link];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // Previous modal-based implementation (commented out)
    // if (link === "privacy") {
    //   setSelectedMarkdown(footerMarkdown.privacy);
    //   setSelectedTitle("Privacy Policy");
    //   setIsPolicyModalOpen(true);
    //   return;
    // }
    // if (link === "grievance") {
    //   setSelectedMarkdown(footerMarkdown.grievance);
    //   setSelectedTitle("Report Grievance");
    //   setIsPolicyModalOpen(true);
    //   return;
    // }
    // if (link === "terms") {
    //   setSelectedMarkdown(footerMarkdown.terms);
    //   setSelectedTitle("Terms & Conditions");
    //   setIsPolicyModalOpen(true);
    // }
  };

  const licenseSegments = license
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean);
  // Keep the licence no. and validity on one line (dot-separated); rest stay on their own lines.
  const licenseLines =
    licenseSegments.length > 1
      ? [`${licenseSegments[0]} . ${licenseSegments[1]}`, ...licenseSegments.slice(2)]
      : licenseSegments;

  return (
    <FooterContainer>
      <FooterInner>
        <LogoSection>
          <IndiaImage src={footerLogoSrc} alt={footerLogoAlt} />
        </LogoSection>
        <SectionDivider />
        <ContentSection>
          <FooterTextStack>
            <FooterCompanyName>{companyName}</FooterCompanyName>
            {licenseLines.map((line, index) => (
              <FooterText key={index}>{line}</FooterText>
            ))}
            <FooterSubText>{copyright}</FooterSubText>
          </FooterTextStack>
          <FooterLinks>
            <FooterLink onClick={() => handleFooterLinkClick("terms")}>Terms & Conditions</FooterLink>
            <FooterLink onClick={() => handleFooterLinkClick("privacy")}>Privacy Policy</FooterLink>
            <FooterLink onClick={() => handleFooterLinkClick("grievance")}>Report Grievance</FooterLink>
          </FooterLinks>
        </ContentSection>
      </FooterInner>
      <MarkDownRenderer
        markdownText={selectedMarkdown}
        open={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        fileName={`${selectedTitle}-document`}
        preview={selectedTitle}
      />
    </FooterContainer>
  );
};

export default Footer;
