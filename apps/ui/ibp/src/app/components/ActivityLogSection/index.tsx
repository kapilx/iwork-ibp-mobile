import React from "react";
import { Tooltip } from "@mui/material";
import { endPoints, useApiQuery } from "@ui/ui-lib";
import { useNavigate } from "react-router-dom";
import {
  ActivityLogContainer,
  ActivityLogHeader,
  ActivityList,
  ActivityItem,
  DateLabel,
  IconWrapper,
  ActivityContent,
  ActivityTitle,
  ActivityDescription,
  ActivityActions,
  PreviewButton,
} from "./styles";
import EyeIcon from "../../assets/svgs/eye.svg";
import { ActivityLogItem, mapActivityToUI } from "../../utils/map-activity-log";

/**
 * ActivityLogSection Component
 * Displays a timeline of user activities with downloadable items on hover
 */
const ActivityLogSection: React.FC = () => {
  const navigate = useNavigate();

  const { data: activityLogs } = useApiQuery({
    queryKey: ["activityLogs"],
    url: `${endPoints.getActivityLogs}`,
    enabled: true,
  });

  const activities: ActivityLogItem[] =
    activityLogs?.data?.map(mapActivityToUI).filter(
      (activity): activity is ActivityLogItem => activity !== null,
    ) || [];

  return (
    <ActivityLogContainer>
      <ActivityLogHeader>Activity Log</ActivityLogHeader>
      <ActivityList>
        {activities.map((activity) => (
          <ActivityItem key={activity.id}>
            <DateLabel>{activity.date}</DateLabel>
            <IconWrapper>
              <img src={activity.icon} alt={activity.title} />
            </IconWrapper>
            <ActivityContent>
              <ActivityTitle>{activity.title}</ActivityTitle>
              <ActivityDescription>{activity.description}</ActivityDescription>
            </ActivityContent>
            <ActivityActions>
              {activity.previewable && (
                <Tooltip
                  title={activity.previewLabel || "Preview"}
                  arrow
                  placement="top"
                >
                  <PreviewButton
                    className="preview-button"
                    onClick={() =>
                      navigate("/activity-log-preview", {
                        state: { activity },
                      })
                    }
                  >
                    <img src={EyeIcon} alt="Preview" />
                  </PreviewButton>
                </Tooltip>
              )}
            </ActivityActions>
          </ActivityItem>
        ))}
      </ActivityList>
    </ActivityLogContainer>
  );
};

export default ActivityLogSection;
