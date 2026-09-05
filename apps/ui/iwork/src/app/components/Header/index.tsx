import {
  CurrencyDisplayMode,
  CustomModal,
  DynamicForm,
  FEEDBACK,
  FeatureKey,
  selectHasPermission,
  clearMessages,
  setCurrencyDisplayMode,
  updateUserDefaultConfig,
  environment,
} from "@ui/ui-lib";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { FeedbackText } from "./styles";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import {
  FEEDBACK_FORM_LINK,
  ILEARN,
  MY_MAILS,
  MY_MAILS_LINK,
  BIZ_DONE_REPORT,
  POPPINS,
  ITICKET,
  ITICKET_LINK,
  MANTHAN_LINK,
  USER_PREFERENCES_TEXT,
  REPORT,
} from "../../constants";
import IIRM_LOGO from "../../assets/svgs/iirm-logo.svg";
import reminderIcon from "../../assets/svgs/reminder-icon.svg";
import NotificationsDrawer, {
  useNotifications,
  NotificationItem,
} from "../NotificationsDrawer";
import { KNOWLEDGE_CENTRAL, LOGO_ALT_MESSAGE } from "../../constants";
import { useAuth } from "../../providers/AuthProvider";
import {
  AvatarContainer,
  DividerLine,
  FlexBox,
  HeaderContainer,
  HeaderIconContainer,
  KnowledgeCentralText,
  LogoImage,
  NameText,
  RightContainer,
  UserDetailsDescription,
  UserDetailsModalContent,
  StyledBadge,
  StyledIcon,
} from "./styles";
import { useSelector, useDispatch } from "react-redux";
import FilePasswordDisplayModal from "../FilePasswordDisplayModal";
import { getStoredUser } from "../../Utils/filePasswordConfig";
import { USER_DETAILS_FORM_CONFIG } from "./config";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signOut } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [userDetailsFormMethods, setUserDetailsFormMethods] =
    useState<ReturnType<typeof useForm>>();
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const [filePasswordDisplayOpen, setFilePasswordDisplayOpen] = useState(false);
  const {  
    notifications,
    unreadCount,
    refresh,
    updateStatus,
    loadMore,
    hasMore,
    filterStatus,
    setFilterStatus,
    isLoading,
  } = useNotifications();

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(clearMessages()); // Clear chat messages on logout
    signOut();
  };

  const handleMyProfileClick = () => {
    handleMenuClose();
    navigate("/my-profile");
  };

  const handleViewFilePassword = () => {
    handleMenuClose();
    setFilePasswordDisplayOpen(true);
  };

  const handleCloseFilePasswordDisplay = () => {
    setFilePasswordDisplayOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/companies");
  };

  const location = useLocation();
  const currentPath = location.pathname;
  const isNotificationActive = Boolean(notificationAnchorEl);

  const isActiveTab = (path: string) => {
    if (isNotificationActive) {
      return false;
    }
    return currentPath === path;
  };
  const userData = getStoredUser();
  const { firstName = "", lastName = "", designation = "" } = userData || {};
  const fullName = `${firstName}`;

  const avatarInitials = `${firstName.charAt(0).toUpperCase()}${lastName
    .charAt(0)
    .toUpperCase()}`;

  const handleKnowledgeCentralClick = () => {
    navigate("/knowledge-central");
  };

  const MyMailsClick = () => {
    window.open(MY_MAILS_LINK, "_blank", "noopener,noreferrer");
  };

  const ReportClick = () => {
    navigate("/report");
  };

  const handleBizDoneReportClick = () => {
    navigate("/biz-done-report");
  };

  const IlearnClick = () => {
    navigate("/ilearn");
  };

  const handleMagicLinkClick = async (appKey: string) => {
    try {
      const response = await apiRequest(endPoints.poppinsAccessUrl, {
        method: "POST",
        data: { appKey },
      });

      const responseData = (response as any)?.data;

      // Extract magic URL from the complete external app response
      // Supports magicLink (Poppins/iConnect), ECARD_DOWNLOAD_URL (E-Card), or any URL value
      const magicUrl =
        responseData?.magicLink ??
        responseData?.ECARD_DOWNLOAD_URL ??
        (typeof responseData === "string" ? responseData : null);

      if (magicUrl) {
        window.open(magicUrl, "_blank");
      } else {
        dispatch(setToastMessage("Failed to get magic URL"));
      }
    } catch (error: any) {
      dispatch(
        setToastMessage(
          error.statusCode === 403
            ? error.message
            : error?.message || "Failed to get magic URL"
        )
      );
    }
  };

  const handlePoppinsClick = () => handleMagicLinkClick("poppins");
  const handleManthanClick = () =>
    window.open(MANTHAN_LINK, "_blank", "noopener,noreferrer");
  const handleIticketClick = () =>
    window.open(ITICKET_LINK, "_blank", "noopener,noreferrer");

  const handleNotificationIconClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    event.stopPropagation();

    if (notificationAnchorEl) {
      setNotificationAnchorEl(null);
    } else {
      refresh();
      setFilterStatus("unread");
      setNotificationAnchorEl(event.currentTarget);
    }
  };

  const handleNotificationItemClick = (item: NotificationItem) => {
    updateStatus(item.id, "read");
    setNotificationAnchorEl(null);
    if (item.redirectUrl) {
      navigate(item.redirectUrl);
    }
  };
  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };
  const viewAdminReports = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_ADMIN_REPORTS)(state)
  );
  const canViewBizDoneReport = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_BUSINESS_PERFORMANCE_REPORT)(state)
  );
  const currencyDisplayMode = useSelector(
    (state: any) =>
      state?.user?.currencyDisplayMode ?? CurrencyDisplayMode.INDIAN
  );

  const handleUserDetailsOpen = () => {
    handleMenuClose();
    setIsUserDetailsOpen(true);
  };

  const handleUserDetailsClose = () => {
    setIsUserDetailsOpen(false);
  };

  const handleUserDetailsSave = () => {
    const selectedMode = userDetailsFormMethods?.getValues(
      "currencyDisplayMode"
    ) as CurrencyDisplayMode;
    if (!selectedMode) return;
    dispatch(setCurrencyDisplayMode(selectedMode));
    dispatch(
      updateUserDefaultConfig({
        entityKey: "LOCALIZATION_PREFERENCE",
        selectedFilterValues: { currencyDisplayMode: selectedMode },
        columns: [],
      }) as any
    );
    handleUserDetailsClose();
  };

  return (
    <>
      <HeaderContainer>
        <FlexBox>
          <LogoImage
            src={IIRM_LOGO}
            alt={LOGO_ALT_MESSAGE}
            onClick={handleLogoClick}
          />
        </FlexBox>
        <RightContainer>
          {canViewBizDoneReport && (
            <KnowledgeCentralText
              isActive={isActiveTab("/biz-done-report")}
              onClick={handleBizDoneReportClick}
            >
              {BIZ_DONE_REPORT}
            </KnowledgeCentralText>
          )}
          <KnowledgeCentralText
            isActive={isActiveTab("/iTicket")}
            onClick={handleIticketClick}
          >
            {ITICKET}
          </KnowledgeCentralText>
          <FeedbackText href={FEEDBACK_FORM_LINK} target="_blank">
            {FEEDBACK}
          </FeedbackText>

          {/* {viewAdminReports && (
            <KnowledgeCentralText
              isActive={isActiveTab("/report")}
              onClick={ReportClick}
            >
              {REPORT}
            </KnowledgeCentralText>
          )} */}

          <KnowledgeCentralText isActive={false} onClick={handlePoppinsClick}>
            {REPORT}
          </KnowledgeCentralText>
          <KnowledgeCentralText
            isActive={isActiveTab("/ilearn")}
            onClick={IlearnClick}
          >
            {ILEARN}
          </KnowledgeCentralText>
          <KnowledgeCentralText
            isActive={isActiveTab("/knowledge-central")}
            onClick={handleKnowledgeCentralClick}
          >
            {KNOWLEDGE_CENTRAL}
          </KnowledgeCentralText>
          <KnowledgeCentralText
            onClick={handleManthanClick}
          >
            Manthan
          </KnowledgeCentralText>
          <KnowledgeCentralText
            isActive={isActiveTab("/my-mails")}
            onClick={MyMailsClick}
          >
            {MY_MAILS}
          </KnowledgeCentralText>
          <KnowledgeCentralText
            isActive={isNotificationActive}
            onClick={handleNotificationIconClick}
          >
            <HeaderIconContainer>
              <StyledBadge
                color="error"
                badgeContent={
                  unreadCount > 0
                    ? unreadCount > 99
                      ? "99+"
                      : unreadCount
                    : null
                }
                data-testid="notification-badge"
                overlap="circular"
              >
                <StyledIcon src={reminderIcon} alt="reminder" />
              </StyledBadge>
            </HeaderIconContainer>
          </KnowledgeCentralText>

          <DividerLine orientation="vertical" flexItem />
          <NameText data-testid={"logged-user-name"}>
            {fullName}, {designation}
          </NameText>
          <AvatarContainer
            onClick={handleAvatarClick}
            aria-controls={open ? "user-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            data-testid={"user-profile-icon"}
          >
            {avatarInitials}
          </AvatarContainer>
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            transitionDuration={0}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleMyProfileClick}>My profile</MenuItem>
          {environment.enableFilePasswordProtection && <MenuItem onClick={handleViewFilePassword}>
              File Password
            </MenuItem>
          }
            <MenuItem onClick={handleUserDetailsOpen}>User preferences</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </RightContainer>
        <NotificationsDrawer
          open={Boolean(notificationAnchorEl)}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          notifications={notifications}
          onItemClick={handleNotificationItemClick}
          onDeleteClick={(id) => updateStatus(id, "delete")}
          onLoadMore={loadMore}
          unreadCount={unreadCount}
          status={filterStatus}
          onStatusChange={setFilterStatus}
          hasMore={hasMore}
          loading={isLoading}
        />
        <CustomModal
          open={isUserDetailsOpen}
          handleClose={handleUserDetailsClose}
          heading="User Preferences"
          buttons={[
            {
              label: "Cancel",
              variant: "secondary",
              onClick: handleUserDetailsClose,
            },
            {
              label: "Save",
              variant: "primary",
              onClick: handleUserDetailsSave,
            },
          ]}
          modalBoxStyles={{ width: "520px", maxWidth: "90vw" }}
        >
          <UserDetailsModalContent>
            <DynamicForm
              formConfig={USER_DETAILS_FORM_CONFIG}
              defaultValues={{ currencyDisplayMode }}
              formMethods={setUserDetailsFormMethods}
              shouldReset
            />
            <UserDetailsDescription>
              {USER_PREFERENCES_TEXT}
            </UserDetailsDescription>
          </UserDetailsModalContent>
        </CustomModal>
      </HeaderContainer>
      <FilePasswordDisplayModal
        open={filePasswordDisplayOpen}
        onClose={handleCloseFilePasswordDisplay}
      />
      <Outlet />
    </>
  );
};

export default Header;
