import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toggleIcon from "../../assets/svgs/toggle-icon.svg";
import {
  StyledDrawer,
  SidebarListItem,
  SidebarListItemText,
  ChildItemWrapper,
  ChildListItemIcon,
  ChildListItemText,
  ToggleWrapper,
  SidebarContainer,
  SidebarItemWrapper,
  ChildItemsContainer,
  DividerWrapper,
  SidebarIconImage,
  ToggleIconImage,
  ExpandCollapseIcon,
  ChildIconImage,
  VersionTypography,
} from "./styles";
import { sidebarItems } from "./config";
import { Collapse } from "@mui/material";
import listIcon from "../../assets/svgs/list-icon.svg";
import { SidebarChildItem, SidebarItem } from "./types";
import {
  ACTIVE,
  DIVIDER,
  HOME,
  TaskMeetingNotesErrorMessages,
} from "../../constants";
import { useDispatch, useSelector } from "react-redux";
import { environment } from "@ui/ui-lib/environment";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import {
  selectRoleName,
  selectCurrentOpportunityType,
} from "@ui/ui-lib/redux";

interface PermissionSettings {
  viewAdminReports: boolean;
  viewAdminRoles: boolean;
  viewEmployeeManagement: boolean;
  viewReleaseNotes: boolean;
  viewTemplateManagement: boolean;
  viewServiceCatalog: boolean;
  canISGAssign: boolean;
  canBDAssign: boolean;
  canViewBizDoneReport: boolean;
  viewBusinessTarget: boolean;
  createEmployeeManagement: boolean;
  canConfigureFilePassword: boolean;
  [key: string]: boolean;
}

// Accept isOpen, onOpen, onClose as props
const Sidebar = ({
  isOpen,
  onOpen,
  onClose,
  permissions,
}: {
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  permissions: PermissionSettings;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isOpen ?? true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const version = environment.version;

  const normalizePermissions = (item: any) => {
    if (item.permissionKey && !item.permissionKeys) {
      item.permissionKeys = [item.permissionKey];
    }
    if (!item.permissionLogic) {
      item.permissionLogic = "AND";
    }
    return item;
  };

  const hasPermissions = (
    permissionKeys: string[] = [],
    logic: "AND" | "OR" = "AND"
  ): boolean => {
    if (permissionKeys.length === 0) return true;
    return logic === "AND"
      ? permissionKeys.every((key) => permissions[key])
      : permissionKeys.some((key) => permissions[key]);
  };

  const roleName = useSelector((state: unknown) =>
    selectRoleName(state as any)
  );

  const currentOpportunityType = useSelector((state: unknown) =>
    selectCurrentOpportunityType(state as any)
  );

  const filteredSidebarItems = sidebarItems
    .map((item) => {
      normalizePermissions(item);

      // Hide item if the current role matches any excluded pattern
      if (item.excludeRolePatterns?.some((pattern) =>
        roleName?.toUpperCase().includes(pattern.toUpperCase())
      )) return null;

      // If parent has children, filter them recursively
      const filteredChildren = (item.children || [])
        .map((child) => normalizePermissions(child))
        .filter((child) => {
          if (!child.permissionKeys) return true;
          return hasPermissions(child.permissionKeys, child.permissionLogic);
        });

      const showParent =
        (!item.permissionKeys || hasPermissions(item.permissionKeys)) &&
        (filteredChildren.length > 0 || !item.children);

      // If the parent itself isn't allowed or has no visible children, skip
      if (!showParent) return null;

      return {
        ...item,
        children: filteredChildren.length > 0 ? filteredChildren : undefined,
      };
    })
    .filter(Boolean); // remove nulls

  useEffect(() => {
    if (typeof isOpen === "boolean") setIsExpanded(isOpen);
  }, [isOpen]);

  const dispatch = useDispatch();

  const toggleExpand = (label: string) => {
    setExpanded((prev) => (prev === label ? null : label));
  };

  const handleToggleSidebar = () => {
    if (isExpanded) {
      setIsExpanded(false);
      if (onClose) onClose();
    } else {
      setIsExpanded(true);
      if (onOpen) onOpen();
    }
  };

  useEffect(() => {
    if (typeof isOpen === "boolean") {
      setIsExpanded(isOpen);
      if (isOpen && onOpen) onOpen();
      if (!isOpen && onClose) onClose();
    }
  }, [isOpen, onClose, onOpen]);

  const updateSelectedItem = <T extends SidebarChildItem>() => {
    const currentPath = location.pathname;
    const { from, sidebarLabel } = (location.state as any) || {};
    // Honour the originating menu item first. Listings forward `sidebarLabel`
    // (e.g. "Manage Quote RO"/"Manage Quote SO" or "My RO"/"My SO") into the
    // shared "/opportunities/:id" details navigation, so a click-through keeps
    // highlighting the item the user actually came from.
    if (sidebarLabel) {
      for (const item of filteredSidebarItems) {
        if (item.label === sidebarLabel) {
          setSelectedItem(item.label);
          setExpanded(null);
          return;
        }

        if (item.children) {
          const matchingChild = (item.children as T[]).find(
            (child) => child.label === sidebarLabel
          );

          if (matchingChild) {
            setSelectedItem(matchingChild.label);
            setExpanded(item.label);
            return;
          }
        }
      }
    }

    // Fallback for the shared "/opportunities/:id" details route when no
    // originating menu item is known (direct URL entry / reload). SO and RO
    // details share the path, so resolve the type from navigation state or the
    // type the detail page publishes after fetching, defaulting to "My RO"/
    // "My SO".
    const isOpportunityDetail = /^\/opportunities\/[^/]+/.test(currentPath);
    if (isOpportunityDetail) {
      const opportunityType = from || currentOpportunityType;
      if (opportunityType === "RO") {
        setSelectedItem("My RO");
        setExpanded("My Service Portfolio");
        return;
      }
      if (opportunityType === "SO") {
        setSelectedItem("Manage SO");
        setExpanded("My Sales Portfolio");
        return;
      }
      // Type not known yet (detail fetch still in flight); fall through so the
      // effect re-resolves once currentOpportunityType is populated.
    }

    for (const item of filteredSidebarItems) {
      if (item.path && item.path === currentPath) {
        setSelectedItem(item.label);
        setExpanded(null);
        return;
      }

      if (item.children) {
        for (const child of item.children as T[]) {
          if (child.path && child.path === currentPath) {
            setSelectedItem(child.label);
            setExpanded(item.label);
            return;
          }
        }
      }
    }

    for (const item of filteredSidebarItems) {
      if (!item.children && item.path && currentPath.startsWith(item.path)) {
        setSelectedItem(item.label);
        setExpanded(null);
        return;
      }

      if (item.children) {
        for (const child of item.children as T[]) {
          if (child.path && currentPath.startsWith(child.path)) {
            setSelectedItem(child.label);
            setExpanded(item.label);
            return;
          }
        }
      }
    }

    // If no match found, reset both selected and expanded
    setSelectedItem(null);
    setExpanded(null);
  };

  useEffect(() => {
    updateSelectedItem();
  }, [location.pathname, filteredSidebarItems, currentOpportunityType]);

  const handleExpandCollapseClick = (e: React.MouseEvent, label: string) => {
    toggleExpand(label);
  };

  const handleDownload = async (item: SidebarItem | SidebarChildItem) => {
    try {
      dispatch(
        setToastMessage({
          message:
            "Biz done report generation started, keep the tab open until it gets downloaded..",
          duration: 20000,
        })
      );

      let downloadUrl = endPoints.downloadBizDoneReport;
      // Use a property like downloadType or downloadUrl to determine the URL
      if (item.downloadType === "bizDoneFY") {
        const financialYear = (new Date().getFullYear() - 1).toString();
        downloadUrl = `${endPoints.downloadBizDoneReport}?financialYear=${financialYear}`;
      }
      // else if (item.downloadType === "somethingElse") { ... }

      const response = await apiRequest(downloadUrl, {
        method: "GET",
      });

      if (response.status === 200 && response?.data) {
        const fileUrl = response.data;
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = "policy_report.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        dispatch(setToastMessage("Policy Report, Download successfully."));
      } else {
        console.error("Invalid response:", response);
        dispatch(setToastMessage("Download failed. Invalid response."));
      }
    } catch (err) {
      console.error("Download error:", err);
      dispatch(setToastMessage("Download failed. Try again."));
    }
  };

  const handleMagicLink = async (appKey: string) => {
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
          error?.statusCode === 403
            ? error.message
            : error?.message || "Failed to get magic URL"
        )
      );
    }
  };

  const handleSidebarItemClick = (
    item: SidebarItem<SidebarChildItem>,
    hasChildren: boolean,
    isExpanded: boolean
  ) => {
    setIsExpanded(true);
    if (onOpen) onOpen();
    setSelectedItem(item.label);
    if (item.magicAppKey) {
      handleMagicLink(item.magicAppKey);
      return;
    }
    if (item.externalUrl) {
      window.open(item.externalUrl, "_blank");
      return;
    }
    if (hasChildren) {
      setExpanded(item.label);
      let firstChild;
      if (
        item.label === "My Portfolio" &&
        item.children?.length! >= 3 &&
        item.children?.[2].label === "My RO"
      ) {
        firstChild = item.children?.[2];
      } else {
        firstChild = item.children?.[0];
      }
      if (firstChild && firstChild.path) {
        const navigationState = { sidebarLabel: firstChild.label };

        if (
          firstChild.label === "My Meetings" ||
          firstChild.label === "My approvals"
        ) {
          const tabName =
            firstChild.label === "My Meetings" ? "meeting" : "approval";
          setSelectedItem(firstChild.label);
          navigate(firstChild.path, {
            state: { ...navigationState, tab: tabName },
          });
        } else {
          setSelectedItem(firstChild.label);
          navigate(firstChild.path, { state: navigationState });
        }
      }
    } else if (item.path) {
      navigate(item.path, { state: { sidebarLabel: item.label } });
    } else if (item.download) {
      handleDownload(item);
    }
    return;
  };

  return (
    <StyledDrawer variant="permanent" open={isExpanded} ref={sidebarRef}>
      <ToggleWrapper
        data-testid="sidebar-toggle"
        isExpanded={isExpanded}
        onClick={handleToggleSidebar}
      >
        <ToggleIconImage
          src={toggleIcon}
          alt="toggle"
          isExpanded={isExpanded}
        />
      </ToggleWrapper>

      {/* Sidebar Items */}
      <SidebarContainer>
        {filteredSidebarItems.map((item, index) => {
          if (item?.type === DIVIDER) {
            return <DividerWrapper key={`divider-${index}`} />;
          }

          const isOpen = expanded === item?.label;
          const isActive =
            selectedItem === item?.label ||
            (item?.children &&
              item.children.some(
                (child: SidebarChildItem) => selectedItem === child.label
              ));
          const hasChildren =
            Array.isArray(item?.children) && item.children.length > 0;

          return (
            <SidebarItemWrapper
              title={!isExpanded ? item?.label : undefined}
              key={item?.label}
            >
              <SidebarListItem
                data-testid={`sidebar-item-${item?.label}`}
                onClick={() =>
                  handleSidebarItemClick(item, hasChildren, isExpanded)
                }
                className={
                  !item?.disabled && isActive
                    ? ACTIVE
                    : item?.disabled && isActive
                      ? "disabled"
                      : ""
                }
              >
                <SidebarIconImage
                  src={
                    !item?.disabled && isActive
                      ? item.activeIcon
                      : item?.disabled
                        ? item?.disabledIcon
                        : item?.icon
                  }
                  alt={item?.label}
                  isActive={isActive}
                />

                {isExpanded && (
                  <SidebarListItemText
                    primary={item?.label}
                    isSelected={selectedItem === "Item Label"}
                    className={item?.disabled ? "disabled-text" : ""}
                  />
                )}
                {isExpanded && hasChildren && (
                  <ExpandCollapseIcon
                    src={listIcon}
                    alt="expand-collapse"
                    isOpen={isOpen}
                    onClick={(e) => handleExpandCollapseClick(e, item.label)}
                    data-testid={`expand-collapse-${item.label}`}
                  />
                )}
              </SidebarListItem>

              {isExpanded && hasChildren && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <ChildItemsContainer>
                    {(item.children as SidebarChildItem[]).map((child) => (
                      <ChildItemWrapper
                        key={child.label}
                        onClick={() => {
                          if (!isExpanded) {
                            setIsExpanded(true);
                            if (onOpen) onOpen();
                            setSelectedItem(child.label);
                            setExpanded(item.label); // Expand parent item
                            return;
                          }
                          // for navigating to specific paths based on child label
                          if (
                            child.label ===
                            TaskMeetingNotesErrorMessages.MY_TASKS
                          ) {
                            navigate(child.path, {
                              state: { tab: "task", sidebarLabel: child.label },
                            });
                          } else if (
                            child.label ===
                            TaskMeetingNotesErrorMessages.MY_MEETINGS
                          ) {
                            navigate(child.path, {
                              state: {
                                tab: "meeting",
                                sidebarLabel: child.label,
                              },
                            });
                          } else if (
                            child.label ===
                            TaskMeetingNotesErrorMessages.MY_APPROVALS
                          ) {
                            navigate(child.path, {
                              state: {
                                tab: "approval",
                                sidebarLabel: child.label,
                              },
                            });
                          } else if (
                            child.label ===
                            TaskMeetingNotesErrorMessages.MY_ASSIGNMENTS
                          ) {
                            navigate(child.path, {
                              state: {
                                tab: "assignment",
                                sidebarLabel: child.label,
                              },
                            });
                          } else if (child?.download) {
                            // Trigger download logic for Biz Done Report
                            handleDownload(child);
                          } else if (child.path) {
                            navigate(child.path, {
                              state: { sidebarLabel: child.label },
                            });
                          }
                          setIsExpanded(true);
                          setSelectedItem(child.label);
                        }}
                        data-testid={`child-item-${child.label}`}
                      >
                        <ChildListItemIcon>
                          <ChildIconImage
                            src={
                              !child.disabled && selectedItem === child.label
                                ? child.activeIcon
                                : child.disabled
                                  ? child.disabledIcon
                                  : child.icon
                            }
                            alt={child.label}
                            isSelected={selectedItem === child.label}
                          />
                        </ChildListItemIcon>
                        <ChildListItemText
                          primary={child.label}
                          isSelected={selectedItem === child.label}
                          className={child.disabled ? "disabled-text" : ""}
                        />
                      </ChildItemWrapper>
                    ))}
                  </ChildItemsContainer>
                </Collapse>
              )}
            </SidebarItemWrapper>
          );
        })}
      </SidebarContainer>
      <VersionTypography isExpanded={isExpanded}>
        <div>Version: {version}</div>
      </VersionTypography>
    </StyledDrawer>
  );
};

export default Sidebar;
