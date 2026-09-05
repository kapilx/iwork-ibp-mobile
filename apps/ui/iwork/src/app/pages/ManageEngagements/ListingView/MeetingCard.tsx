import {
  NormalActivityContainer,
  EllipsisNormalTaskName,
  CompanyActivityRow,
  NormalTaskMeta,
  EllipsisTaskDescription,
  NormalCheckboxWrapper,
  NormalInfoForMeeting,
  CustomTypographyForMeetingPurpose,
  DotIconContainer,
  MeetingIconContainer,
  NormalHeaderForMeeting,
  ContentBoxForDetails,
  StyledDate,
  EllipsisCalendarDescription,
} from "./styles";
import { Box, IconButton } from "@mui/material";
import DotIcon from "../../../assets/svgs/dot-icon.svg";
import MeetingIcon from "../../../assets/svgs/meeting-icon.svg";
import ActivityTargetIcon from "../../../assets/svgs/activity-target.svg";
import { endPoints, useApiMutation } from "@ui/ui-lib";
import MarkAsCompleteTickAfter from "../../../assets/svgs/mark-as-complete-tick-after.svg";

interface MeetingCardProps {
  meeting: any;
  onClick?: (meeting: any) => void;
  onFeedback?: (meeting: any) => void;
  fromCalendar?: boolean;
}

const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  onClick,
  onFeedback,
  fromCalendar = false,
}) => {
  const dueDate = meeting.meetingDate;
  const dateObj = dueDate ? new Date(dueDate) : null;
  const month = dateObj
    ? dateObj.toLocaleString("en-US", { month: "short" })
    : "";
  const date = dateObj ? dateObj.getDate() : "";

  // API mutation hook for fetching meeting by ID
  const { mutate: fetchMeetingById } = useApiMutation({
    config: {
      onSuccess: (response: any) => {
        if (onClick && response?.data) {
          onClick(response.data);
        }
      },
      onError: (error: unknown) => {
        // Optionally handle error (toast, etc.)
      },
    },
  });

  return (
    <NormalActivityContainer
      onClick={() => {
        if (onClick && meeting?.id) {
          fetchMeetingById({
            endpoint: endPoints.getMeetingById(Number(meeting.id)),
            method: "GET",
          });
        }
      }}
    >
      <NormalCheckboxWrapper title={meeting?.isFeedbackSubmitted ? "Completed" : "Feedback"}>
        {(() => {
          const now = new Date();
          const meetingDate = meeting.meetingDate
            ? new Date(meeting.meetingDate)
            : null;
          const isCompleted =
            meeting?.meetingStatus?.lookUpValue === "Completed";
          const isPastOrToday =
            meetingDate &&
           new Date(meetingDate.setHours(0, 0, 0, 0)) <= new Date(now.setHours(0, 0, 0, 0));

          if (meeting?.isFeedbackSubmitted === "MEETING_FEEDBACK_SUBMITTED") {
            return (
            <IconButton size="small" disabled>
              <img src={MarkAsCompleteTickAfter} alt="completed" />
            </IconButton>
        )
          } else if (isPastOrToday) {
            return (
              <>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFeedback && onFeedback(meeting);
                  }}
                >
                  <img src={ActivityTargetIcon} alt="feedback" />
                </IconButton>
              </>
            );
          }

          // No icon for future meetings that are not completed
          return null;
        })()}
      </NormalCheckboxWrapper>
      <NormalInfoForMeeting>
        {!fromCalendar && (
          <MeetingIconContainer>
            <div>
              <img src={MeetingIcon} alt="" />
            </div>
          </MeetingIconContainer>
        )}
        <ContentBoxForDetails>
          <NormalHeaderForMeeting>
            {fromCalendar && (
              <MeetingIconContainer>
                <div>
                  <img src={MeetingIcon} alt="" />
                </div>
              </MeetingIconContainer>
            )}
            <EllipsisNormalTaskName title={meeting.meetingPurpose} fromCalendar={fromCalendar}>
              {meeting.meetingType?.lookUpValue}
              {!fromCalendar && (
                <>
                  {" "}
                  <StyledDate meetingType={meeting.meetingType?.lookUpValue}>
                    {date && month
                      ? `${date.toString().padStart(2, "0")} ${month}`
                      : ""}
                  </StyledDate>
                </>
              )}
            </EllipsisNormalTaskName>
          </NormalHeaderForMeeting>
          <CustomTypographyForMeetingPurpose>
            {meeting.meetingPurpose}
          </CustomTypographyForMeetingPurpose>

          {(meeting.company || meeting.activity) && (
            <CompanyActivityRow>
              {meeting.company ? (
                <NormalTaskMeta>
                  {meeting.company.displayName || meeting.company.name}
                </NormalTaskMeta>
              ) : (
                <NormalTaskMeta as="span">--</NormalTaskMeta>
              )}
              {
                meeting.company && meeting.activity && (
                  <DotIconContainer>
                    <img src={DotIcon} alt="dot" />
                  </DotIconContainer>
                )
              }
              {meeting.activity && (
                <NormalTaskMeta as="span">
                  {meeting.activity.activityName ||
                    meeting.activity.name ||
                    "--"}
                </NormalTaskMeta>
              )}
            </CompanyActivityRow>
          )}
          {meeting.meetingAgenda && (
            <EllipsisCalendarDescription title={meeting.meetingAgenda}>
              {`Agenda: ${meeting.meetingAgenda}`}
            </EllipsisCalendarDescription>
          )}
        </ContentBoxForDetails>
      </NormalInfoForMeeting>
    </NormalActivityContainer>
  );
};

export default MeetingCard;