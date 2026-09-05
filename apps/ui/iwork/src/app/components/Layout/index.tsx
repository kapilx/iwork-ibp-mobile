import { FeatureKey, RightNav, Sidebar, selectHasPermission } from "@ui/ui-lib";
import { Outlet, useLocation } from "react-router-dom";
import {
  BlockingLoaderOverlay,
  ContentContainer,
  LayoutContainer,
  SidebarWrapper,
  StyledOutlet,
} from "./styles";
import { useEffect, useRef, useState } from "react";
import FloatingAssistant from "../FloatingAssistant";
import ComponentMount from "../ComponentMount";
import { useSelector } from "react-redux";
import TaskMeetingNotesDetail from "../../pages/TaskMeetingNotesPage/TaskMeetingNotesDetail";
import { CircularProgress } from "@mui/material";

const Layout = () => {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Add state for both navs
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isRightNavOpen, setRightNavOpen] = useState(false);
  const floatingIconRef = useRef<HTMLImageElement>(null);
  const floatingCardRef = useRef<HTMLDivElement>(null);
  const NAV_TRANSITION_DELAY = 600;

  const hasAiNudgeAccess = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_AI_NUDGE_ACCESS)(state),
  );

useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Ensure default nav state based on route: open RightNav and close Sidebar for routes with nudges
  useEffect(() => {
    let rightNavTimer: ReturnType<typeof setTimeout> | undefined;
    let sidebarTimer: ReturnType<typeof setTimeout> | undefined;

    const path = location.pathname;
    const shouldOpenRightNav =
      hasAiNudgeAccess &&
      (path.startsWith("/dashboard") ||
        path.includes("/engagements/meetings") ||
        path.includes("/engagements/tasks") ||
        path.startsWith("/companies") ||
        path.startsWith("/contact") ||
        (path.includes("/opportunities") && !path.includes("/renewal")) ||
        path.includes("/renewal-opportunities") ||
        path.startsWith("/policies"));

    if (shouldOpenRightNav) {
      setSidebarOpen(false);
      // Stagger the open to keep the animation smooth instead of abrupt jumps
      rightNavTimer = setTimeout(() => {
        setRightNavOpen(true);
      }, NAV_TRANSITION_DELAY);
    } else {
      setRightNavOpen(false);
      sidebarTimer = setTimeout(() => {
        setSidebarOpen(true);
      }, NAV_TRANSITION_DELAY);
    }

    return () => {
      if (rightNavTimer) clearTimeout(rightNavTimer);
      if (sidebarTimer) clearTimeout(sidebarTimer);
    };
  }, [location.pathname, hasAiNudgeAccess]);

  // Handlers to ensure only one nav is open at a time
  const handleSidebarOpen = () => {
    setSidebarOpen(true);
    setRightNavOpen(false);
  };
  const handleSidebarClose = () => setSidebarOpen(false);

  const handleRightNavOpen = () => {
    setRightNavOpen(true);
    setSidebarOpen(false);
  };
  const handleRightNavClose = () => setRightNavOpen(false);

  const viewAdminReports = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_ADMIN_REPORTS)(state),
  );
  const viewAdminRoles = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_ADMIN_ROLES)(state),
  );

  const editCronConfiguration = useSelector((state: any) =>
    selectHasPermission(FeatureKey.EDIT_CRON_CONFIGURATION)(state)
  );

  const viewMigrationLog = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_MIGRATION_LOG)(state)
  );

  const viewEmployeeManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_EMPLOYEE)(state),
  );

  const createEmployeeManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.CREATE_EMPLOYEE)(state),
  );

  const viewReleaseNotes = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_RELEASE_NOTES)(state),
  );

  const viewTemplateManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_TEMPLATE_MANAGEMENT)(state)
  );
  const viewServiceCatalog = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_SERVICE_CATALOG)(state)
  );

  const canISGAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_ISG_ACTIVITY)(state),
  );
  const canBDAssign = useSelector((state: any) =>
    selectHasPermission(FeatureKey.ASSIGN_BD_ACTIVITY)(state),
  );

  const canViewBizDoneReport = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_BUSINESS_PERFORMANCE_REPORT)(state),
  );

  const viewBusinessTarget = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_BUSINESS_TARGET)(state),
  );

  const viewBrokerManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_BROKER)(state),
  );

  const viewOpportunity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_OPPORTUNITY)(state),
  );

  // ISG "activities read" capability gates the combined Manage Quotes menu item
  // (spec §4.1): visible to ISG-only and BD+ISG, hidden for BD-only.
  const viewIsgActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_ISG_ACTIVITY)(state),
  );

  const viewBDActivity = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_BD_ACTIVITY)(state),
  );

  const viewPolicyManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_POLICY)(state),
  );

  const viewCompanyManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_COMPANY)(state),
  );

  const viewContactManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_CONTACT)(state),
  );

  const viewInsurerManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_INSURER)(state),
  );

  const viewTpaManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_TPA)(state),
  );

  const viewRewardManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_REWARD)(state),
  );

  const viewEndorsementManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_ENDORSEMENT)(state),
  );

  const viewClaimsManagement = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_CLAIMS)(state),
  );

  const canGiveApprovalForBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state),
  );
  const canGiveApprovalForISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state),
  );

  const canConfigureFilePassword = useSelector((state: any) =>
    selectHasPermission(FeatureKey.FILE_PASSWORD_CONFIGURATION_ENABLE)(state),
  );

  // TODO: Remove hardcoded true after backend permission is configured
  const canManageDocuments = true; // Temporarily set to true for UI development

  const loading = useSelector((state: any) => state.user.loading);

  return (
    <ComponentMount>
      <LayoutContainer>
        <SidebarWrapper>
          <Sidebar
            isOpen={isSidebarOpen}
            onOpen={handleSidebarOpen}
            onClose={handleSidebarClose}
            permissions={{
              viewAdminReports: viewAdminReports,
              viewAdminRoles: viewAdminRoles,
              editCronConfiguration: editCronConfiguration,
              viewMigrationLog: viewMigrationLog,
              viewEmployeeManagement: viewEmployeeManagement,
              viewReleaseNotes: viewReleaseNotes,
              viewTemplateManagement: viewTemplateManagement,
              viewServiceCatalog: viewServiceCatalog,
              canISGAssign: canISGAssign,
              canBDAssign: canBDAssign,
              canViewBizDoneReport: canViewBizDoneReport,
              viewBusinessTarget: viewBusinessTarget,
              viewBrokerManagement: viewBrokerManagement,
              viewOpportunity: viewOpportunity,
              viewIsgActivity: viewIsgActivity,
              viewBDActivity: viewBDActivity,
              createEmployeeManagement: createEmployeeManagement,
              viewPolicyManagement: viewPolicyManagement,
              viewCompanyManagement: viewCompanyManagement,
              viewContactManagement: viewContactManagement,
              viewInsurerManagement: viewInsurerManagement,
              viewTpaManagement: viewTpaManagement,
              viewRewardManagement: viewRewardManagement,
              viewEndorsementManagement: viewEndorsementManagement,
              viewClaimsManagement: viewClaimsManagement,
              canGiveApprovalForBD: canGiveApprovalForBD,
              canGiveApprovalForISG: canGiveApprovalForISG,
              canConfigureFilePassword: canConfigureFilePassword,
              canManageDocuments: canManageDocuments,
            }}
          />
        </SidebarWrapper>
        <ContentContainer ref={contentRef} $isLoading={loading}>
          {loading && (
            <BlockingLoaderOverlay data-testid="global-loader">
              <CircularProgress />
            </BlockingLoaderOverlay>
          )}
          <StyledOutlet>
            <Outlet />
          </StyledOutlet>
        </ContentContainer>
        <RightNav
          isOpen={isRightNavOpen}
          onOpen={handleRightNavOpen}
          onClose={handleRightNavClose}
          externalRefs={[floatingIconRef, floatingCardRef]}
          children={<TaskMeetingNotesDetail />}
        />
        <FloatingAssistant
          iconRef={floatingIconRef}
          cardRef={floatingCardRef}
        />
      </LayoutContainer>
    </ComponentMount>
  );
};

export default Layout;
