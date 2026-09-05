import React, { useMemo, useState } from "react";
import Slider from "react-slick";
import { Box, Typography } from "@mui/material";
import { useApiQuery, endPoints, CustomTabs } from "@ui/ui-lib";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import {
  CardAvatar,
  CustomCakeIcon,
  DateText,
  EmployeeName,
  MetaText,
  NoUpcomingHeading,
  SmallCardAvatar,
  StyledSliderWrapper,
  TodayCard,
  TodayDate,
  TodaysCelebrationsContainer,
  TodaysCelebrationsContainerHeading,
  TodaysCelebrationsContainerSubHeading,
  UpcomingCard,
  UpcomingCardCardsContainer,
  UpcomingCardContainer,
  UpcomingCardDetails,
  UpcomingCardDetailsDate,
  UpcomingCardDetailsName,
  UpcomingHeading,
} from "./styles";
import { CELEBRATION_NOUN, CelebrationType } from "../../constants/enum";
import {
  ANNIVERSARIES,
  BIRTHDAYS,
  ERROR_CELEBRATIONS,
  ID,
  LOADING_CELEBRATIONS,
  NO_UPCOMIMG_BIRTHDAYS,
  NO_UPCOMING_ANNIVERSARIES,
  PEOPLE_ARE,
  PERSON_IS,
  TODAY,
  UPCOMING,
} from "../../constants";
import { CelebrationCard } from "./types";
import { ListSkeleton } from "../DashboardSkeletons";

const getInitial = (name?: string) =>
  name?.trim()?.charAt(0)?.toUpperCase() ?? "";

/** === Renderers === */
const renderTodayCelebration = (
  employees: CelebrationCard[],
  type: CelebrationType
) => {
  const hasItems = employees?.length > 0;
  const multi = employees.length > 1;

  const settings = {
    dots: multi,
    infinite: multi,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: multi, // stop autoplay if 0 or 1 item
    autoplaySpeed: 5000,
  };

  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "short" });

  return (
    <TodaysCelebrationsContainer>
      <TodaysCelebrationsContainerHeading>
        <CustomCakeIcon />
        {TODAY} {day} {month}
      </TodaysCelebrationsContainerHeading>

      {!hasItems ? (
        <NoUpcomingHeading>
          {type === CelebrationType.BIRTHDAY
            ? `No ${BIRTHDAYS} today`
            : `No ${ANNIVERSARIES} today`}
        </NoUpcomingHeading>
      ) : (
        <>
          <TodaysCelebrationsContainerSubHeading>
            {employees.length}{" "}
            {employees.length === 1 ? `${PERSON_IS}` : `${PEOPLE_ARE}`}{" "}
            celebrating {CELEBRATION_NOUN[type]}
          </TodaysCelebrationsContainerSubHeading>

          <StyledSliderWrapper>
            <Slider {...settings}>
              {employees.map((employee) => (
                <TodayCard key={employee.employeeId}>
                  <CardAvatar
                    src={employee.profileUrl || undefined}
                    imgProps={{ referrerPolicy: "no-referrer" }}
                  >
                    {getInitial(employee.fullName)}
                  </CardAvatar>
                  <TodayDate>
                    <EmployeeName>{employee.fullName}</EmployeeName>
                    <DateText>
                      {ID}
                      {employee.employeeId}
                    </DateText>
                  </TodayDate>
                </TodayCard>
              ))}
            </Slider>
          </StyledSliderWrapper>
        </>
      )}
    </TodaysCelebrationsContainer>
  );
};

const renderUpcomingList = (items: CelebrationCard[]) => (
  <UpcomingCardCardsContainer>
    {items.map((item) => {
      const dateStr = new Date(item.celebrationDate).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "short" }
      );
      return (
        <UpcomingCardContainer key={item.employeeId}>
          <UpcomingCard>
            <SmallCardAvatar
              src={item.profileUrl || undefined}
              imgProps={{ referrerPolicy: "no-referrer" }}
            >
              {getInitial(item.fullName)}
            </SmallCardAvatar>
            <UpcomingCardDetails>
              <UpcomingCardDetailsName>{item.fullName}</UpcomingCardDetailsName>
              <MetaText>
                {ID}
                {item.employeeId}
              </MetaText>
            </UpcomingCardDetails>
          </UpcomingCard>
          <UpcomingCardDetailsDate>{dateStr}</UpcomingCardDetailsDate>
        </UpcomingCardContainer>
      );
    })}
  </UpcomingCardCardsContainer>
);

/** === Component === */
const CelebrationsCard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("birthday");

  const {
    data: celebrationsResponse,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["employee-celebrations"],
    url: endPoints.employeeCelebrations,
    enabled: true,
  });

  const isToday = (date: string | Date) => {
    const today = new Date();
    const d = new Date(date);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isUpcoming = (date: string | Date) => {
    const today = new Date();
    const d = new Date(date);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return d > today && d <= nextWeek;
  };

  const { tabsData } = useMemo(() => {
    const celebrations: CelebrationCard[] =
      celebrationsResponse?.data?.data || [];

    const todayBirthdays = celebrations.filter(
      (c) =>
        c.celebrationType === CelebrationType.BIRTHDAY &&
        isToday(c.celebrationDate)
    );
    const upcomingBirthdays = celebrations.filter(
      (c) =>
        c.celebrationType === CelebrationType.BIRTHDAY &&
        isUpcoming(c.celebrationDate)
    );

    const todayAnniversaries = celebrations.filter(
      (c) =>
        c.celebrationType === CelebrationType.WORK_ANNIVERSARY &&
        isToday(c.celebrationDate)
    );
    const upcomingAnniversaries = celebrations.filter(
      (c) =>
        c.celebrationType === CelebrationType.WORK_ANNIVERSARY &&
        isUpcoming(c.celebrationDate)
    );

    const tabs = [
      {
        label: `${BIRTHDAYS} (${todayBirthdays.length})`,
        content: (
          <Box>
            {renderTodayCelebration(todayBirthdays, CelebrationType.BIRTHDAY)}
            <UpcomingHeading>
              {UPCOMING} {CELEBRATION_NOUN.BIRTHDAY}
            </UpcomingHeading>
            {upcomingBirthdays.length > 0 ? (
              <>{renderUpcomingList(upcomingBirthdays)}</>
            ) : (
              <NoUpcomingHeading>{NO_UPCOMIMG_BIRTHDAYS}</NoUpcomingHeading>
            )}
          </Box>
        ),
        tabKey: "birthday",
      },
      {
        label: `${ANNIVERSARIES} (${todayAnniversaries.length})`,
        content: (
          <Box>
            {renderTodayCelebration(
              todayAnniversaries,
              CelebrationType.WORK_ANNIVERSARY
            )}
            <UpcomingHeading>
              {" "}
              {UPCOMING} {CELEBRATION_NOUN.WORK_ANNIVERSARY}
            </UpcomingHeading>
            {upcomingAnniversaries.length > 0 ? (
              <>{renderUpcomingList(upcomingAnniversaries)}</>
            ) : (
              <NoUpcomingHeading>{NO_UPCOMING_ANNIVERSARIES}</NoUpcomingHeading>
            )}
          </Box>
        ),
        tabKey: "anniversary",
      },
    ];

    return { tabsData: tabs };
  }, [celebrationsResponse]);

  if (isLoading) return <ListSkeleton items={3} height={72} />;

  if (error)
    return (
      <Box>
        <Typography color="error">
          {ERROR_CELEBRATIONS} {error.message}
        </Typography>
      </Box>
    );

  return (
    <Box>
      <CustomTabs
        tabs={tabsData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        styles={{
          tabColor: "#666",
          activeTabColor: "#1976D2",
          underlineColor: "#E0E0E0",
          tabSpacing: "24px",
        }}
        tabsProps={{ variant: "scrollable", scrollButtons: "auto" }}
      />
    </Box>
  );
};

export default CelebrationsCard;
