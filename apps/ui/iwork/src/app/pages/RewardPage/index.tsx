import React from "react";
import RewardListing from "./RewardTable";
import { RewardPageStyledContainer, TitleContainer } from "./styles";

interface RewardPageProps {
    title?: string;
}

const RewardPage: React.FC<RewardPageProps> = ({
    title = "Insurer Rewards",
}) => {
    return (
        <RewardPageStyledContainer>
            <TitleContainer variant="h1">{title}</TitleContainer>
            <RewardListing />
        </RewardPageStyledContainer>
    );
};

export default RewardPage;
