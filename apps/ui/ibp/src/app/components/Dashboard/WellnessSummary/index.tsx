import React from 'react'
import { StyledCardHeader, StyledContainer, StyledHeading, StyledPointCard, StyledPointContent, StyledPointdate, StyledPointLabel, StyledPointsContainer, StyledPointTime, StyledStatusContainer, Styledsummary, StyledSummaryCard, StyledSummaryContent, StyledsummaryValue, SyledSummaryLabel } from './styles'
import summaryIcon from "../../../assets/svgs/summary-icon.svg";
import { wellnessSummaryData } from '../constants';

interface SummaryStatistic {
  id: string;
  value: string;
  label: string;
}

interface AppointmentData {
  id: string;
  service: string;
  date: string;
  time: string;
  status: string;
}

interface WellnessSummaryProps {
  title?: string;
  summaryStats?: SummaryStatistic[];
  appointments?: AppointmentData[];
  summaryIcon?: string;
}

function WellnessSummary({ 
  title = wellnessSummaryData.title,
  summaryStats = wellnessSummaryData.summaryStats,
  appointments = wellnessSummaryData.appointments,
  summaryIcon: icon = wellnessSummaryData.icon,
}: WellnessSummaryProps) {
    return (
        <StyledContainer>
            <StyledHeading>
                {title}
            </StyledHeading>
            <StyledSummaryCard data-testid="ibp-wellness-summary-card">
                <StyledCardHeader>
                    <Styledsummary>
                        {summaryStats.map((stat) => (
                            <StyledSummaryContent key={stat.id}>
                                <StyledsummaryValue>
                                    {stat.value}
                                </StyledsummaryValue>
                                <SyledSummaryLabel>
                                    {stat.label}
                                </SyledSummaryLabel>
                            </StyledSummaryContent>
                        ))}
                    </Styledsummary>

                    <img src={icon} alt="summary" />

                </StyledCardHeader>
                <StyledPointsContainer>
                    {appointments.map((appointment) => (
                        <StyledPointCard key={appointment.id} data-testid="ibp-wellness-appointment-card">
                            <StyledPointContent>
                                <StyledPointLabel>
                                    {appointment.service}
                                </StyledPointLabel>
                                <StyledPointdate>
                                    {appointment.date}
                                </StyledPointdate>
                                <StyledPointTime>
                                    {appointment.time}
                                </StyledPointTime>
                            </StyledPointContent>
                            <StyledStatusContainer>
                                {appointment.status}
                            </StyledStatusContainer>
                        </StyledPointCard>
                    ))}
                </StyledPointsContainer>
            </StyledSummaryCard>
        </StyledContainer>
    )
}

export default WellnessSummary