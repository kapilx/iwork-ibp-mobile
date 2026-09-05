import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import headerLogo from "../../../assets/svgs/header-logo.svg";
import {
  CloseRounded,
  MenuRounded,
  PersonRounded,
  LogoutRounded,
  LockResetRounded,
  SwitchAccountRounded,
  SelfImprovementRounded,
  SwapHorizRounded,
  ChevronLeftRounded,
} from "@mui/icons-material";
import {
  // ActionIcons,
  AvatarContainer,
  HeaderActionMenuItem,
  HeaderDangerMenuItem,
  HeaderDrawerFooter,
  HeaderDrawerLogoutButton,
  HeaderDrawerPaper,
  HeaderDrawerProfileButton,
  HeaderDrawerAvatar,
  HeaderDrawerList,
  HeaderDrawerTopRow,
  HeaderProfileMenuItem,
  FloatingQuickLinkItem,
  FloatingQuickLinkLabel,
  FloatingQuickLinksHeader,
  FloatingQuickLinksHandle,
  FloatingQuickLinksHandleLabelBox,
  FloatingQuickLinksHandleLabel,
  FloatingQuickLinksList,
  FloatingQuickLinksRail,
  HeaderContainer,
  HeaderDivider,
  HeaderExternalNavGroup,
  HeaderExternalNavItem,
  HeaderLeftSection,
  HeaderLeftSectionLogo,
  HeaderNavItem,
  HeaderNavItemContainer,
  HeaderNavRightSection,
  HeaderNavSection,
  HeaderRightSection,
  HeaderRightSectionLogo,
  MobileMenuButton,
  NameText,
  // PopoverContainer,
  // PopoverDescription,
  // PopoverImageContainer,
} from "./styles";

import { Box, Divider, Drawer, IconButton, ListItemButton, ListItemText, Menu, Typography } from "@mui/material";
import CommonLoader from "../../common/CommonLoader";
import { LOGOUT, NAV_ITEMS } from "../../constants/index";
import { useDispatch, useSelector } from "react-redux";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import { RootState } from "../../redux/store";
import iirmKenyaLogo from "../../assets/pngs/iirm-kenya-logo.png";
import iirmSrilankaLogo from "../../assets/pngs/iirm-sri-lanka-logo.png";
import { apiRequest, CustomModal, endPoints, environment, useApiQuery } from "@ui/ui-lib";
import { usePoliciesFlags } from "../../hooks/usePoliciesFlags";
import { clearPortalConfiguration } from "../../redux/portalConfigSlice";
import { setToastMessage } from "../../redux/slice";
import quickLinksHospitalNetwork from "../../assets/svgs/quick-links-hospital-network.svg";
import quickLinksDocuments from "../../assets/svgs/quick-links-documents.svg";
import quickLinksPolicyFeatures from "../../assets/svgs/quick-links-policy-feature.svg";
import quickLinksLifeEvents from "../../assets/svgs/quick-links-life-events.svg";
import quickLinksTpaLogin from "../../assets/svgs/quick-links-tpa-login.svg";
import quickLinksWhatsappIcon from "../../assets/svgs/support-whatsapp-icon.svg"

export const headerLogoMap: Record<string, string> = {
    "india": headerLogo,
    "kenya": iirmKenyaLogo,
    "maldives": headerLogo,
    "sri lanka": iirmSrilankaLogo
};

function formatEcardDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  }
  return dateStr;
}

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const [isQuickLinksExpanded, setIsQuickLinksExpanded] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isQrImageLoaded, setIsQrImageLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [portalLogoUrl, setPortalLogoUrl] = useState<string | null>(null);
  const [isEnrollmentCompleted, setIsEnrollmentCompleted] =
    useState<boolean>(false);
  const quickLinksHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { logoUrl, logoFileId, portalBrandingConfig, portalDashboardConfig } =
    useCompanyConfig();
  // Gate the external "Wellness" / "Policy Porting" nav buttons on the
  // company's dashboard config flags (same source as the dashboard banners).
  const isNavItemVisible = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.key === "wellness-link") {
      return portalDashboardConfig?.wellnessBanner?.enabled === true;
    }
    if (item.key === "policy-porting") {
      return portalDashboardConfig?.portingBanner?.enabled === true;
    }
    return true;
  };
  const companyLogoId = useSelector((state: RootState) => {
    const configData = state.portalConfig.data as {
      companyLogoId?: number | null;
    } | null;
    return configData?.companyLogoId ?? null;
  });
  const logoIdCandidates = [
    logoFileId,
    companyLogoId,
    portalBrandingConfig?.companyLogoFileId ?? null,
  ]
    .filter((id): id is number => typeof id === "number" && id > 0);
  // const quickLinksOpen = Boolean(quickLinksAnchorEl);

  // Determine active nav item based on current pathname
  const getActiveNavKey = () => {
    const currentPath = location.pathname;
    const activeItem = NAV_ITEMS.find((item) =>
      Array.isArray(item.path)
        ? item.path.includes(currentPath)
        : item.path === currentPath,
    );
    return activeItem?.key || null;
  };

  const isActive = getActiveNavKey();

  const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
  const employeeId = userDetails?.id;

  // Fire-and-forget prefetch when employee clicks Claims Corner nav item.
  // Delegates to the backend sync endpoint which handles TTL cache + Redis lock.
  const prefetchTpaClaims = () => {
    if (!employeeId) return;
    (async () => {
      try {
        const ecardResp = await apiRequest(endPoints.eCards(employeeId), { method: "GET" });
        const records = (ecardResp as any)?.data?.ecarddata;
        const primaryEcard = Array.isArray(records) && records.length > 0 ? records[0] : null;
        if (!primaryEcard?.policyNumber) return;

        await apiRequest(
          endPoints.tpaClaimsSync(
            primaryEcard.policyNumber,
            formatEcardDate(primaryEcard.policyFrom),
            formatEcardDate(primaryEcard.policyTo),
            employeeId,
          ),
          { method: "GET" },
        );
      } catch {
        // Silent — prefetch errors never block navigation
      }
    })();
  };

  const { employeeName = "", isEmployee, isHR, roleKey } = userDetails;
  const isHybridUser = Boolean(isEmployee && (isHR || roleKey === "PORTAL_CRM"));
  const countryName = String(userDetails?.country || "");
  const countryKey = countryName.toLowerCase();
  const rightLogoSrc = headerLogoMap[countryKey] || headerLogo;
  const rightLogoAlt = `${countryName || "Default"} Insure Logo`;

  const avatarInitials = employeeName?.charAt(0).toUpperCase() || "U";
  const isMenuOpen = Boolean(anchorEl);

   const policiesData = useSelector((state: RootState) => state.policyData?.policiesData);
  const { data: employeeDetailsResponse, refetch: refetchEmployeeDetails } = useApiQuery({
    queryKey: ["headerEmployeeDetails", employeeId],
    url: employeeId ? endPoints.employeeDetails : "",
    enabled: Boolean(employeeId),
  });

  // Reuses the same cached ["employeePolicies", employeeId] query as the
  // Dashboard (no extra network call). When every policy is add-only-dependents,
  // the enrolment-oriented nav items are hidden — the flow is only for
  // collecting dependents pre-enrolment.
  const { data: headerPoliciesResponse } = useApiQuery({
    queryKey: ["employeePolicies", employeeId],
    url: employeeId ? endPoints.employeePolicies(employeeId) : "",
    enabled: Boolean(employeeId),
  });

  const addOnlyDependents = useMemo(() => {
    const data = (headerPoliciesResponse as any)?.data ?? {};
    const allPolicies = [
      ...(data.employeePolicies ?? []),
      ...(data.enrolledPolicies ?? []),
    ];
    return (
      allPolicies.length > 0 &&
      allPolicies.every((policy: any) => policy?.addOnlyDependents === true)
    );
  }, [headerPoliciesResponse]);

  // Nav items hidden while in add-only-dependents mode.
  const isHiddenForAddOnlyDependents = (key: string) =>
    addOnlyDependents &&
    ["claims-corner", "claims-intimation", "e-card", "faqs", "support"].includes(
      key,
    );

  const { refetch: fetchTpaPortalSso, isFetching: isSsoFetching } = useApiQuery({
    queryKey: ["tpaPortalSsoQuickLink", employeeId],
    url: employeeId ? endPoints.employeeTpaPortalSso(employeeId) : "",
    enabled: false,
    config: { retry: 0 },
  });

  const handleTpaPortalClick = async () => {
    try {
      const result = await fetchTpaPortalSso();
      const redirectUrl = (result?.data as any)?.data?.redirectUrl ?? (result?.data as any)?.redirectUrl;
      if (redirectUrl) {
        window.open(redirectUrl, "_blank", "noopener,noreferrer");
      } else {
        const msg = (result?.failureReason as any)?.message ?? "TPA portal is not available.";
        dispatch(setToastMessage({ message: msg, type: "error" }));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "TPA portal is not available.";
      dispatch(setToastMessage({ message: msg, type: "error" }));
    }
  };

  const [isWellnessLoading, setIsWellnessLoading] = useState(false);

  const handleWellnessClick = async () => {
    if (isWellnessLoading) return;
    setIsWellnessLoading(true);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write("<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc'><p style='color:#555;font-size:15px'>Redirecting to Wellness Portal…</p></body></html>");
      win.document.close();
    }
    try {
      const res = await apiRequest(endPoints.alyveWellnessUrl, {
        method: "POST",
        data: {
          appKey: "alyve-wellness",
          dynamicFields: {
            mobile: userDetails?.phone ?? userDetails?.mobile ?? userDetails?.phoneNumber ?? "",
            // mobile: "",
            name: userDetails?.employeeName ?? userDetails?.fullName ?? "",
            gender: String(userDetails?.gender?.value ?? userDetails?.gender ?? "").toLowerCase(),
            dob: (userDetails?.dateOfBirth ?? userDetails?.dob ?? "").toString().slice(0, 10),
          },
        },
      });
      const redirectUrl = (res as any)?.data?.jsonData?.redirect_url ?? (res as any)?.jsonData?.redirect_url;
      if (redirectUrl && win && !win.closed) {
        win.location.replace(redirectUrl);
        win.focus();
      } else {
        win?.close();
        const msg = (res as any)?.data?.message ?? (res as any)?.message;
        dispatch(setToastMessage({ message: msg || "Unable to open Wellness portal. Please try again.", type: "error" }));
      }
    } catch (err: any) {
      win?.close();
      const msg = err?.response?.data?.message ?? err?.message;
      dispatch(setToastMessage({ message: msg || "Unable to open Wellness portal. Please try again.", type: "error" }));
    } finally {
      setIsWellnessLoading(false);
    }
  };

  const { hasGMCPolicy, hasAnyPolicyForLifeEvents } = usePoliciesFlags();

  const hasAnyEditablePolicy = useMemo(() => {
    if (!policiesData) return false;

    const { employeePolicies = [], enrolledPolicies = [] } = policiesData;
    const allPolicies = [...employeePolicies, ...enrolledPolicies];

    return allPolicies.some((policy: any) => policy?.isEditable === true);
  }, [policiesData]);

  useEffect(() => {
    const payload =
      (employeeDetailsResponse as any)?.data?.data ??
      (employeeDetailsResponse as any)?.data ??
      employeeDetailsResponse ??
      {};
    const statuses = payload?.policyEnrollmentStatuses ?? [];
    if (!Array.isArray(statuses) || statuses.length === 0) {
      return;
    }
    const enrollmentCompleted = statuses.every(
      (policy: any) =>
        policy?.employeeEnrollmentStatusKey ===
        "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED",
    );
    setIsEnrollmentCompleted(enrollmentCompleted);
  }, [employeeDetailsResponse]);

  useEffect(() => {
    if (!employeeId) return;
    refetchEmployeeDetails?.();
  }, [employeeId, location.pathname, refetchEmployeeDetails]);

  const shouldOpenSummary = isEnrollmentCompleted;

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onProfileCLick = () => {
    navigate("/profile");
  };

  const handleLogoClick = () => {
    const isAuthenticated = Boolean(sessionStorage.getItem("user"));
    navigate(isAuthenticated ? "/dashboard" : "/landing");
  };

  const handleChangePasswordClick = () => {
    navigate("/profile", {
      state: {
        openChangePassword: true,
      },
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest(endPoints.getActivityLogs, {
        method: "POST",
        data: {
          activityKey: "LOGGED_OUT",
          activityCategory: "AUTH",
          referenceId: userDetails?.employeeId,
          referenceType: "USER",
          metadata: null,
        },
        headers: { userid: String(userDetails?.employeeId) },
      });
    } catch (_error) {
      // Keep logout reliable even if activity logging fails.
    }

    dispatch(clearPortalConfiguration());
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("sessionStartedAt");
    handleMenuClose();
    setIsMobileMenuOpen(false);
    navigate("/landing");
  };

  const clearQuickLinksHoverTimer = () => {
    if (quickLinksHoverTimerRef.current) {
      clearTimeout(quickLinksHoverTimerRef.current);
      quickLinksHoverTimerRef.current = null;
    }
  };

  const handleQuickLinksMouseEnter = () => {
    clearQuickLinksHoverTimer();
    quickLinksHoverTimerRef.current = setTimeout(() => {
      setIsQuickLinksExpanded(true);
      quickLinksHoverTimerRef.current = null;
    }, 80);
  };

  const handleQuickLinksClose = () => {
    clearQuickLinksHoverTimer();
    quickLinksHoverTimerRef.current = setTimeout(() => {
      setIsQuickLinksExpanded(false);
      quickLinksHoverTimerRef.current = null;
    }, 190);
  };


  useEffect(() => {
    return () => {
      clearQuickLinksHoverTimer();
    };
  }, []);

  const quickRailItems = useMemo(
    () =>
      [
        // hasGMCPolicy? 
          {
              key: "hospital-network",
              label: "Hospital Network",
              icon: <img src={quickLinksHospitalNetwork} alt="Hospital Network" />,
              onClick: () => navigate("/hospital"),
          },
          // : null,
        {
          key: "documents",
          label: "My Documents",
          icon: <img src={quickLinksDocuments} alt="Documents" />,
          onClick: () => navigate("/my-documents"),
        },
        {
          key: "policy-features",
          label: "Policy Features",
          icon: <img src={quickLinksPolicyFeatures} alt="Policy Features" />,
          onClick: () => navigate("/policy-features"),
        },
        // hasGMCPolicyForLifeEvents
        //   ?
           {
              key: "life-events",
              label: "Life Events",
              icon: <img src={quickLinksLifeEvents} alt="Life Events" />,
              onClick: () => {
                navigate("/life-events");
              },
            },
          // : null,
        {
          key: "tpa-login",
          label: isSsoFetching ? "Redirecting..." : "TPA Login",
          icon: <img src={quickLinksTpaLogin} alt="TPA Login" />,
          onClick: handleTpaPortalClick,
          disabled: isSsoFetching,
        },
        {
          key: "chat-bot",
          label: "Chat support",
          icon: <img src={quickLinksWhatsappIcon} alt="Quick links" />,
          onClick: () => setIsQrModalOpen(true)
        }
      ].filter(
        (item) =>
          Boolean(item) &&
          !(addOnlyDependents && item.key === "policy-features") &&
          // Hide Life Events when the feature flag is off OR the company
          // explicitly disabled it (enableLifeEvents === false).
          !(
            item.key === "life-events" &&
            (!environment.featureFlag.FF_LIFE_EVENT_DEPENDENT_MANAGEMENT ||
              portalDashboardConfig?.enableLifeEvents === false)
          ),
      ),
    [hasGMCPolicy, hasAnyPolicyForLifeEvents, isEnrollmentCompleted, hasAnyEditablePolicy, navigate, shouldOpenSummary, isSsoFetching, handleTpaPortalClick, addOnlyDependents, portalDashboardConfig],
  );

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const fetchLogo = async () => {
      if (logoIdCandidates.length === 0) {
        setPortalLogoUrl(null);
        return;
      }

      for (const logoId of logoIdCandidates) {
        try {
          const response = await apiRequest(
            endPoints.ibpFileUploadDownloadById(logoId),
            { responseType: "blob" },
          );
          if (!active) return;
          const blobData = (response as any)?.data ?? response;
          objectUrl = URL.createObjectURL(blobData);
          setPortalLogoUrl(objectUrl);
          return;
        } catch (_error) {
          // Try next candidate
        }
      }

      if (active) {
        setPortalLogoUrl(null);
      }
    };

    fetchLogo();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [logoIdCandidates.join("|")]);

  const hasDownloadableLogo = logoIdCandidates.length > 0;
  const resolvedLogoSrc =
    portalLogoUrl || (!hasDownloadableLogo ? logoUrl : null);

  // Hover-only: the rail is open while hovered and closes on mouse-leave.
  const quickLinksOpen = isQuickLinksExpanded;

  return (
    <HeaderContainer>
      <HeaderLeftSection>
        {resolvedLogoSrc && (
          <HeaderLeftSectionLogo
            src={resolvedLogoSrc}
            alt="Company Logo"
            onClick={handleLogoClick}
          />
        )}
        <HeaderNavSection>
          {NAV_ITEMS.filter((item) => item.key !== "quick-links" && !item.external && !isHiddenForAddOnlyDependents(item.key)).map((item) => (
            <HeaderNavItemContainer key={item.key}>
              <NavLink
                to={Array.isArray(item.path) ? item.path[0] : item.path}
                style={{ textDecoration: "none" }}
                onClick={() => { if (item.key === "claims-corner") prefetchTpaClaims(); }}
              >
                <HeaderNavItem active={isActive === item.key}>
                  {item.label}
                </HeaderNavItem>
              </NavLink>
            </HeaderNavItemContainer>
          ))}
        </HeaderNavSection>
      </HeaderLeftSection>
      <HeaderNavRightSection>
        <HeaderExternalNavGroup>
          {NAV_ITEMS.filter((item) => item.external && isNavItemVisible(item)).map((item) => {
            const isWellness = item.key === "wellness-link";
            return (
              <HeaderExternalNavItem
                key={item.key}
                variant={item.key === "policy-porting" ? "blue" : "green"}
                onClick={
                  isWellness
                    ? handleWellnessClick
                    : () => window.open(item.href, "_blank", "noopener,noreferrer")
                }
                style={
                  isWellness
                    ? {
                        cursor: isWellnessLoading ? "wait" : "pointer",
                        opacity: isWellnessLoading ? 0.6 : 1,
                      }
                    : undefined
                }
              >
                {item.key === "policy-porting" ? (
                  <SwapHorizRounded fontSize="inherit" />
                ) : (
                  <SelfImprovementRounded fontSize="inherit" />
                )}
                {isWellness && isWellnessLoading ? "Loading..." : item.label}
              </HeaderExternalNavItem>
            );
          })}
        </HeaderExternalNavGroup>
        <HeaderRightSection>
          {/* {isHybridUser && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/hr-portal")}
              sx={{
                mr: 1.5,
                textTransform: "none",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: "6px",
                whiteSpace: "nowrap",
              }}
            >
              Switch to HR Portal
            </Button>
          )} */}
          <HeaderDivider></HeaderDivider>
          <AvatarContainer
            onClick={handleAvatarClick}
            data-testid={"user-profile-icon"}
          >
            {avatarInitials}
          </AvatarContainer>
          <NameText onClick={handleAvatarClick}>{employeeName}</NameText>
          <HeaderDivider></HeaderDivider>
          <HeaderRightSectionLogo src={rightLogoSrc} alt={rightLogoAlt} />
        </HeaderRightSection>
      </HeaderNavRightSection>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <HeaderProfileMenuItem
          onClick={() => {
            handleMenuClose();
            onProfileCLick();
          }}
        >
          <PersonRounded />
          Profile
        </HeaderProfileMenuItem>

      {isHybridUser && (
        <HeaderProfileMenuItem onClick={() => navigate("/hr-portal/portfolio")}>
          <SwitchAccountRounded />
          Switch to Risk Watch
        </HeaderProfileMenuItem>
      )}
        
        <HeaderActionMenuItem
          onClick={() => {
            handleMenuClose();
            handleChangePasswordClick();
          }}
        >
          <LockResetRounded />
          Change Password
        </HeaderActionMenuItem>

        <Divider />

        <HeaderDangerMenuItem
          onClick={() => {
            handleLogout();
          }}
        >
          <LogoutRounded />
          {LOGOUT}
        </HeaderDangerMenuItem>
      </Menu>

      {/* Hamburger — visible only on mobile (< sm) */}
      <MobileMenuButton
        aria-label="Open navigation menu"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <MenuRounded />
      </MobileMenuButton>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="left"
        open={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ component: HeaderDrawerPaper }}
      >
        {/* Close button — right-aligned, no extra padding */}
        <HeaderDrawerTopRow>
          <IconButton
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
            size="small"
          >
            <CloseRounded />
          </IconButton>
        </HeaderDrawerTopRow>

        {/* Nav items at the top */}
        <HeaderDrawerList>
          {NAV_ITEMS.filter((item) => item.key !== "quick-links" && isNavItemVisible(item) && !isHiddenForAddOnlyDependents(item.key)).map((item) => (
            <ListItemButton
              key={item.key}
              onClick={() => {
                setIsMobileMenuOpen(false);
                if (item.external) {
                  window.open(item.href, "_blank", "noopener,noreferrer");
                } else if (item.key === "wellness") {
                  handleWellnessClick();
                } else if (item.key === "claims-corner") {
                  prefetchTpaClaims();
                  navigate("/claims-corner");
                } else if (item.key === "claims-intimation") {
                  navigate("/claims-intimation");
                } else {
                  navigate(Array.isArray(item.path) ? item.path[0] : item.path);
                }
              }}
              selected={isActive === item.key}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </HeaderDrawerList>

        {/* Profile + Logout — pinned at bottom */}
        <HeaderDrawerFooter>
          <HeaderDrawerProfileButton
            onClick={() => { setIsMobileMenuOpen(false); navigate("/profile"); }}
          >
            <HeaderDrawerAvatar>
              {avatarInitials}
            </HeaderDrawerAvatar>
            <ListItemText primary={employeeName || "Profile"} primaryTypographyProps={{ fontWeight: 400, fontSize: 14 }} />
          </HeaderDrawerProfileButton>

          <Divider />

          <HeaderDrawerLogoutButton
            onClick={handleLogout}
          >
            <LogoutRounded fontSize="small" />
            <ListItemText primary={LOGOUT} primaryTypographyProps={{ fontWeight: 400, fontSize: 14 }} />
          </HeaderDrawerLogoutButton>
        </HeaderDrawerFooter>
      </Drawer>

      {/* Quick Links are hidden while in add-only-dependents mode. */}
      {!addOnlyDependents && (
        <>
      <FloatingQuickLinksHandle
          aria-label="Expand quick links"
          onClick={() => {
            clearQuickLinksHoverTimer();
            setIsQuickLinksExpanded(true);
          }}
          onMouseEnter={handleQuickLinksMouseEnter}
          onMouseLeave={handleQuickLinksClose}
        >
          <svg
            className="ql-handle-shape"
            viewBox="0 0 59 339"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="qlHandleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F4EA8" />
                <stop offset="100%" stopColor="#1A84A3" />
              </linearGradient>
            </defs>
            <path
              d="M59 339H48C31.9837 339 19 326.016 19 310V203.074C7.89227 198.842 0 188.094 0 175.5V162.5C0 149.906 7.8921 139.157 19 134.925V29C19 12.9837 31.9837 5.15408e-07 48 0H59V339Z"
              fill="url(#qlHandleGradient)"
            />
          </svg>
          <ChevronLeftRounded />
          <FloatingQuickLinksHandleLabelBox>
            <FloatingQuickLinksHandleLabel>Quick</FloatingQuickLinksHandleLabel>
          </FloatingQuickLinksHandleLabelBox>
        </FloatingQuickLinksHandle>

      <FloatingQuickLinksRail
        expanded={quickLinksOpen}
        onMouseEnter={handleQuickLinksMouseEnter}
        onMouseLeave={handleQuickLinksClose}
      >
        <FloatingQuickLinksHeader
          expanded={true}
        >
           Quick Links
        </FloatingQuickLinksHeader>
        <FloatingQuickLinksList expanded={true}>
          {quickRailItems.map((item) => (
            <FloatingQuickLinkItem
              key={item.key}
              expanded={true}
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                handleQuickLinksClose();
              }}
            >
              {item.icon}
              <FloatingQuickLinkLabel expanded={true}>
                {item.label}
              </FloatingQuickLinkLabel>
            </FloatingQuickLinkItem>
          ))}
        </FloatingQuickLinksList>
      </FloatingQuickLinksRail>
        </>
      )}

      <CustomModal
        open={isQrModalOpen}
        handleClose={() => {
          setIsQrModalOpen(false);
          setIsQrImageLoaded(false);
        }}
        heading={<Typography sx={{ color: "#222", fontWeight: 600 }}>Chat Support</Typography>}
        modalBoxStyles={{ maxWidth: "320px", width: "100%" }}
      >
        <Box sx={{ position: "relative", width: "100%", height: "300px" }}>
          {!isQrImageLoaded && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CommonLoader size={40} />
            </Box>
          )}
          <img
            src="https://goodhealthtpa.com/wp-content/uploads/2024/09/I4A2FPAGJM4UC1.png"
            alt="WhatsApp QR Code"
            onLoad={() => setIsQrImageLoaded(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: isQrImageLoaded ? "block" : "none",
            }}
          />
        </Box>
        <Typography
          sx={{
            mt: 2,
            textAlign: "center",
            fontSize: "13px",
            color: "#555",
          }}
        >
          Need help? Scan the QR code and start chatting instantly.
        </Typography>
      </CustomModal>

      {/*
        Legacy quick-links behavior retained as comment (as requested):
        - Quick Links was a header nav item.
        - Clicking it opened a Popover with icon cards for:
          Hospital Network, Documents, Enrolment Status, Policy Feature,
          Life Events, and TPA Login.
        - Current implementation replaces that popover with a right-side
          collapsed/expandable rail while preserving these routes.
      */}

    </HeaderContainer>
  );
};

export default Header;
