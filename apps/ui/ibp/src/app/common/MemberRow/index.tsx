import { capitalizeFirst } from "../../utils";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CloseIcon from "@mui/icons-material/Close";
import { useState } from "react";
import {
  MemberRowWrapper,
  MemberName,
  MemberRelation,
  ActionsContainer,
  ActionBox,
  ActionText,
  NotCoverIcon,
  CelebrationContainer,
  RibbonContainer,
} from "./styles";

type MemberRowProps = {
  name: string;
  relation: string;
  covered: boolean;
  disabled?: boolean;
  isLastRow?: boolean;
  onChange: (covered: boolean) => void;
};

const colors = [
  "#ff4d4f", // red
  "#ffd666", // yellow
  "#69c0ff", // blue
  "#73d13d", // green
  "#9254de", // purple
  "#ffa940", // orange
];

const RibbonExplosion = () => {
  return (
    <RibbonContainer>
      <svg width="40" height="40" viewBox="0 0 40 40">
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (360 / 8) * i;
          const color = colors[i % colors.length];

          return (
            <line
              key={i}
              x1="20"
              y1="20"
              x2="20"
              y2="5"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{
                transformOrigin: "20px 20px",
                transform: `rotate(${angle}deg)`,
                animation: "ribbon-burst 700ms ease-out forwards",
              }}
            />
          );
        })}

        <style>
          {`
            @keyframes ribbon-burst {
              0% {
                stroke-dasharray: 0 20;
                opacity: 1;
              }
              100% {
                stroke-dasharray: 20 0;
                opacity: 0;
              }
            }
          `}
        </style>
      </svg>
    </RibbonContainer>
  );
};

const MemberRow = ({
  name,
  relation,
  covered,
  disabled,
  isLastRow,
  onChange,
}: MemberRowProps) => {
  const [celebrate, setCelebrate] = useState(false);
  
  // Self should always be disabled from uncovering (always covered)
  const isSelf = relation.toLowerCase() === "self" || relation.toLowerCase() === "employee";
  const isActuallyDisabled = disabled || isSelf;

  const handleCover = () => {
    if (isActuallyDisabled) return;

    // Only celebrate and change if not already covered
    if (!covered) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 700);
      onChange(true);
    }
  };

  const handleUncover = () => {
    if (isActuallyDisabled) return;
    
    // Self cannot be uncovered
    if (isSelf) return;
    
    // Only change if currently covered
    if (covered) {
      onChange(false);
    }
  };

  return (
    <MemberRowWrapper isLastRow={isLastRow}>
      <MemberName>{name}</MemberName>
      <MemberRelation>{capitalizeFirst(relation)}</MemberRelation>

      <ActionsContainer>
        {/* Cover */}
        <ActionBox
          isActuallyDisabled={isActuallyDisabled}
          onClick={handleCover}
        >
          {covered ? (
            <CheckCircleIcon sx={{ color: "success.main", fontSize: "20px" }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: "text.disabled", fontSize: "20px" }} />
          )}
          <ActionText covered={covered}>
            Cover
          </ActionText>

          {celebrate && (
            <CelebrationContainer>
              <RibbonExplosion />
            </CelebrationContainer>
          )}
        </ActionBox>

        {/* Not Cover */}
        <ActionBox
          isActuallyDisabled={isActuallyDisabled}
          isSelf={isSelf}
          onClick={handleUncover}
        >
          {!covered ? (
            <NotCoverIcon>
              <CloseIcon sx={{ fontSize: "14px" }} />
            </NotCoverIcon>
          ) : (
            <RadioButtonUncheckedIcon sx={{ color: "text.disabled", fontSize: "20px" }} />
          )}
          <ActionText isNotCover={!covered}>
            Not Cover
          </ActionText>
        </ActionBox>
      </ActionsContainer>
    </MemberRowWrapper>
  );
};

export default MemberRow;
