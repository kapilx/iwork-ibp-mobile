import { Typography } from "@mui/material";
import { ListSkeleton } from "../DashboardSkeletons";
import {
  Card,
  CardContentLeft,
  CardContentRight,
  Container,
  CustomDivider,
  Description,
  EmptyStateContainer,
  Title,
  IconTitleWrapper,
  StyledCampaignIcon,
} from "./styles";
import { useApiQuery, endPoints, formatDate } from "@ui/ui-lib";

const Announcement = () => {
  const { data, isLoading, error } = useApiQuery({
    url: endPoints.announcement,
    queryKey: ["businessPerformanceData", endPoints.announcement],
  });

  const formatExpiryDate = (dateString: string): string => {
    if (!dateString?.trim()) {
      return "";
    }

    return formatDate(dateString, "DD MMM") || "";
  };

  const validateAnnouncementData = (data: any): boolean => {
    return data?.data?.data && Array.isArray(data.data.data);
  };

  if (isLoading) {
    return (
      <Container>
        <ListSkeleton items={3} height={72} />
      </Container>
    );
  }

  if (!validateAnnouncementData(data) || data.data.data.length === 0) {
    return (
      <Container>
        <EmptyStateContainer>
          <Typography>
            There are currently no announcements to display.
          </Typography>
        </EmptyStateContainer>
      </Container>
    );
  }

  return (
    <Container>
      {data.data.data?.map((announcement: any, index: number) => (
        <div key={announcement.id || index}>
          <Card>
            <CardContentLeft>
              <IconTitleWrapper>
                <span role="img" aria-label="announcement">
                  <StyledCampaignIcon fontSize="medium" />
                </span>
                <Title>{announcement.title}</Title>
              </IconTitleWrapper>
              <Description>{announcement.description}</Description>
            </CardContentLeft>
            <CardContentRight>
              {formatExpiryDate(announcement.expiryDate)}
            </CardContentRight>
          </Card>
          {index !== data?.data?.data.length - 1 && <CustomDivider />}
        </div>
      ))}
    </Container>
  );
};

export default Announcement;
