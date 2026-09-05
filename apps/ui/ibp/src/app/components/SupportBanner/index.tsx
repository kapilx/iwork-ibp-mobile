import React from 'react'
import { IconButton } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import { useNavigate } from 'react-router-dom'
import { SupportBannerContainer, SupportBannerHeading, SupportBannerDescription, SupportBannerTextContainer } from './styles'

interface SupportBannerProps {
  withHeaderOffset?: boolean;
}

const SupportBanner: React.FC<SupportBannerProps> = ({ withHeaderOffset = true }) => {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(sessionStorage.getItem("user"));
  const handleBack = () => navigate(isAuthenticated ? "/dashboard" : "/");
  return (
    <SupportBannerContainer withHeaderOffset={withHeaderOffset}>
      <IconButton
        onClick={handleBack}
        aria-label="Go back"
        sx={{ position: "absolute", top: 16, left: 16, p: 0, color: "#fff" }}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: "inherit" }} />
      </IconButton>
        <SupportBannerTextContainer>
      <SupportBannerHeading>
        How can we help you ?
      </SupportBannerHeading>
      <SupportBannerDescription>
        Find answers to common questions or connect with our support team.
      </SupportBannerDescription>
      </SupportBannerTextContainer>
      {/* <SearchInputContainer>
        <SearchInput
          type="text"
          placeholder="Ask a question…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
                <img src={searchIcon} alt="Search" style={{ width: 20, height: 20 }} />

      </SearchInputContainer> */}
      {/* <SupportBannerImage src={SupportImage} alt="Support" /> */}
    </SupportBannerContainer>
  )
}

export default SupportBanner
