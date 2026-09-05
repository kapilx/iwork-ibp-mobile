import {
  MessageOverlay,
  apiRequest,
  endPoints,
  formatDate,
  useApiMutation,
  useApiQuery,
} from "@ui/ui-lib";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { CircularProgress } from "@mui/material";
import closeIcon from "../../assets/svgs/close-icon.svg";
import {
  LOAD_MORE,
  NOTIFICATION,
  NOTIFICATION_DELETE,
  NOTIFICATION_READ,
  NOTIFICATION_UNREAD,
} from "../../constants";
import {
  DrawerHeader,
  List,
  ListItem,
  StyledBodyText,
  StyledLoadMore,
  StyledNotificationMessage,
  HeaderRow,
  CloseIcon,
  StyledSwicthBlock,
  StyledDrawerHeader,
  StyledNotificationTitle,
  StyledSwitchBlock,
  LoaderOverlay,
  StyledDate,
} from "./styles";
import { useNavigate } from "react-router-dom";
import { TEMPLATE_MANAGEMENT_BASE_PATH } from "../../routes/template-management.route";

export interface NotificationItem {
  id: number;
  message: string;
  redirectUrl?: string;
  read?: boolean;
  body?: string;
  date?: string;
}

export const useNotifications = () => {
  const [filterStatus, setFilterStatus] = useState<"unread" | "read">("unread");
  const [limits, setLimits] = useState({ unread: 10, read: 10 });

  const limit = limits[filterStatus];

  const apiStatus =
    filterStatus === "unread" ? NOTIFICATION_UNREAD : NOTIFICATION_READ;

  const { data, refetch, isFetching } = useApiQuery({
    url: endPoints.getNotifications(apiStatus, 1, limit),
    queryKey: ["notifications", filterStatus, limit],
    enabled: !!sessionStorage.getItem("user"),
  });

  const notifications: NotificationItem[] = useMemo(() => {
    const list = data?.data?.notification || [];
    return list.map((n: any) => ({
      id: n.id,
      message: n.subject ?? n.message,
      body: n.body.entityId
        ? `${n.body.content.split(":")[0]}:${n.body?.entityId}`
        : `${n.body.content.split(":")[0]}`,
      redirectUrl: n.body.entityId
        ? `/${n.body.entityType}${n.body.entityType === TEMPLATE_MANAGEMENT_BASE_PATH ? `/preview/${n.body.entityId}?redirect=true` : `/${n.body.entityId}`}`
        : undefined,
      read: n.status === "read",
      date: n.createdAt,
    }));
  }, [data]);

  const unreadCount = data?.data?.unreadCount || 0;
  const hasMore = notifications.length >= limit;

  const { mutateAsync } = useApiMutation({});

  const updateStatus = useCallback(
    async (notificationId: number, status: "read" | "delete") => {
      const reqStatus =
        status === "read"
          ? NOTIFICATION_READ
          : status === "delete"
          ? NOTIFICATION_DELETE
          : NOTIFICATION_UNREAD;

      await mutateAsync({
        endpoint: endPoints.updateNotificationReadStatus(),
        method: "PUT",
        data: { status: reqStatus, id: notificationId },
      });

      refetch();
    },
    [mutateAsync, refetch]
  );

  const loadMore = useCallback(() => {
    setLimits((prev) => ({
      ...prev,
      [filterStatus]: prev[filterStatus] + 10,
    }));
  }, [filterStatus]);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!notifications.length) return;
      const latestId = notifications[0].id;
      const status = await apiRequest(
        endPoints.checkLatestNotification(apiStatus, latestId)
      );
      if (status?.data?.anyNewNotification) {
        refetch();
      }
    }, 100000);

    return () => clearInterval(interval);
  }, [notifications, refetch]);

  return {
    notifications,
    unreadCount,
    refresh,
    updateStatus,
    loadMore,
    hasMore,
    filterStatus,
    setFilterStatus,
    isLoading: isFetching,
  };
};

interface NotificationsDrawerProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  notifications: NotificationItem[];
  onItemClick: (item: NotificationItem) => void;
  onDeleteClick: (id: number) => void;
  onLoadMore: () => void;
  unreadCount: number;
  status: "unread" | "read";
  onStatusChange: (status: "unread" | "read") => void;
  hasMore: boolean;
  loading: boolean;
}
const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  open,
  anchorEl,
  onClose,
  notifications,
  onItemClick,
  onDeleteClick,
  onLoadMore,
  unreadCount,
  status,
  onStatusChange,
  hasMore,
  loading,
}) => {
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleDelete = (id: number) => {
    setRemovingId(id);
    setTimeout(() => {
      onDeleteClick(id);
      setRemovingId(null);
    }, 300);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <MessageOverlay
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      transformOrigin={{ vertical: -15, horizontal: "right" }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      height={600}
      width={320}
    >
      <>
        <HeaderRow>
          <StyledDrawerHeader>
            <DrawerHeader>{`${NOTIFICATION} ( ${unreadCount} )`}</DrawerHeader>
            <StyledSwicthBlock>
              <span>{status === "unread" ? "Unread" : "Read"}</span>
              <StyledSwitchBlock
                checked={status === "unread"}
                onChange={(_, checked: boolean) =>
                  onStatusChange(checked ? "unread" : "read")
                }
              />
            </StyledSwicthBlock>
          </StyledDrawerHeader>
        </HeaderRow>
        <div style={{ position: "relative" }}>
          {(loading || loadingMore) && (
            <LoaderOverlay data-testid="notification-loader">
              <CircularProgress />
            </LoaderOverlay>
          )}
          <List data-testid="notifications-list">
            {notifications.map((n: NotificationItem) => (
              <ListItem
                key={n.id}
                onClick={() => {
                  onItemClick(n);
                  if (n.redirectUrl) {
                    navigate(n.redirectUrl);
                  }
                }}
                data-testid={`notification-${n.id}`}
                read={n.read}
                removing={removingId === n.id}
              >
                <StyledNotificationTitle>
                  <StyledNotificationMessage>
                    {n.message}
                  </StyledNotificationMessage>
                  <CloseIcon
                    src={closeIcon}
                    alt="close"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(n.id);
                    }}
                  />
                </StyledNotificationTitle>
                <StyledBodyText>{n.body}</StyledBodyText>
                <StyledDate>
                  {n.date
                    ? formatDate(n.date)
                    : // new Date(n.date).toLocaleDateString(undefined, {
                      //     year: "numeric",
                      //     month: "short",
                      //     day: "2-digit",
                      //   })
                      "-"}
                </StyledDate>
              </ListItem>
            ))}
            {hasMore && (
              <StyledLoadMore onClick={handleLoadMore} data-testid="load-more">
                {loadingMore ? <CircularProgress size={16} /> : LOAD_MORE}
              </StyledLoadMore>
            )}
          </List>
        </div>
      </>
    </MessageOverlay>
  );
};

export default NotificationsDrawer;
