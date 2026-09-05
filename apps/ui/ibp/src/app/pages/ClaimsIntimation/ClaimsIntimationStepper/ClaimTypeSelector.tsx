import { Box, Typography } from "@mui/material";
import { claimTypeOptions } from "./config";
import {
  ClaimTypeCard,
  ClaimTypeCardContent,
  ClaimTypeCardCopy,
  ClaimTypeCardDescription,
  ClaimTypeCardIcon,
  ClaimTypeCardLabel,
  ClaimTypeCardRadio,
  ClaimTypeCardText,
  ClaimTypeGrid,
  ClaimTypeHeader,
} from "./styles";

type ClaimTypeSelectorProps = {
  value?: string;
  onChange: (value: string) => void;
  errorMessage?: string;
};

export const ClaimTypeSelector = ({
  value,
  onChange,
  errorMessage,
}: ClaimTypeSelectorProps) => {
  return (
    <Box sx={{mb: 4}}>
      <ClaimTypeHeader>
        <Typography sx={{ fontSize: 14, color:"#1E2861B3"}}>
          Claim Type{" "}
          <Box component="span" sx={{ color: "#E53935" }}>
            *
          </Box>
        </Typography>
      </ClaimTypeHeader>
      <ClaimTypeGrid>
        {claimTypeOptions.map((option) => {
          const selected = value === option.value;
          return (
            <ClaimTypeCard
              key={option.value}
              selected={selected}
              type="button"
              onClick={() => onChange(option.value)}
            >
                <ClaimTypeCardCopy>
                  <ClaimTypeCardIcon selected={selected}>
                    <img src={option.icon} alt="" width={28} height={28} />
                  </ClaimTypeCardIcon>
                  <ClaimTypeCardText>
                    <ClaimTypeCardLabel selected={selected}>
                      {option.label}
                    </ClaimTypeCardLabel>
                    <ClaimTypeCardDescription selected={selected}>
                      {option.description}
                    </ClaimTypeCardDescription>
                  </ClaimTypeCardText>
                </ClaimTypeCardCopy>
                <ClaimTypeCardRadio selected={selected} aria-hidden="true" />
            </ClaimTypeCard>
          );
        })}
      </ClaimTypeGrid>
      {errorMessage ? (
        <Typography
          sx={{
            mt: 1.5,
            color: "#D32F2F",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {errorMessage}
        </Typography>
      ) : null}
    </Box>
  );
};
