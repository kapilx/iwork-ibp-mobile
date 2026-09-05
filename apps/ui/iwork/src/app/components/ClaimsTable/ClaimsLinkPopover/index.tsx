import React, { useState, useEffect, useRef } from "react";
import { Popover, Fade } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  PopoverContainer,
  NoticeHeader,
  AlertIcon,
  NoticeTitle,
  NoticeContent,
  CustomDivider,
  NoticePoints,
  NoticePoint,
  ClaimsLink,
  MUIPopover,
  CrossIcon,
  SectionTitle,
  SectionDescription,
  OptionTitle,
  ButtonContainer,
} from "./styles";
import alertIcon from "../../../assets/svgs/alert-circle.svg";
import fileIcon from "../../../assets/svgs/file-pen-icon.svg";
import fileUpload from "../../../assets/svgs/file-upload-icon.svg";
import filePlus from "../../../assets/svgs/file-plus-icon.svg";
import crossIcon from "../../../assets/svgs/cross-icon.svg";
import { Button } from "@ui/ui-lib";
import { CLAIM_IMPORTANT_NOTICE } from "../../../constants";

interface ClaimsLinkPopoverProps {
  onUploadClaims?: () => void;
}

const ClaimsLinkPopover: React.FC<ClaimsLinkPopoverProps> = ({
  onUploadClaims,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [autoOpen, setAutoOpen] = useState(true);
  const navigate = useNavigate();
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  // ✅ Auto open when component mounts
  useEffect(() => {
    if (autoOpen && linkRef.current) {
      setAnchorEl(linkRef.current);

      const timer = setTimeout(() => {
        setAnchorEl(null);
        setAutoOpen(false); // prevent reopening again
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [autoOpen]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <ClaimsLink ref={linkRef} onClick={handleClick}>
        {CLAIM_IMPORTANT_NOTICE.mainLink}
      </ClaimsLink>

      <MUIPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        TransitionComponent={Fade}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <PopoverContainer>
          <NoticeHeader>
            <AlertIcon src={alertIcon} alt="Alert" />
            <NoticeTitle>{CLAIM_IMPORTANT_NOTICE.title}</NoticeTitle>
          </NoticeHeader>
          <CrossIcon src={crossIcon} alt="close" onClick={handleClose} />

          <NoticeContent>{CLAIM_IMPORTANT_NOTICE.content}</NoticeContent>

          {CLAIM_IMPORTANT_NOTICE.sections?.map((section, index) => (
            <React.Fragment key={index}>
              <SectionTitle>{section.title}</SectionTitle>
              <SectionDescription>{section.description}</SectionDescription>
            </React.Fragment>
          ))}

          <CustomDivider />

          <NoticeTitle heading="create">
            {CLAIM_IMPORTANT_NOTICE.mainLink}
          </NoticeTitle>

          {CLAIM_IMPORTANT_NOTICE.options?.map((option, optionIndex) => (
            <React.Fragment key={optionIndex}>
              <OptionTitle>{option.title}</OptionTitle>
              <NoticePoints>
                {option.points?.map((point, pointIndex) => (
                  <NoticePoint key={pointIndex}>
                    {point.firstPart}
                    {point.secondPart && (
                      <>
                        <AlertIcon src={fileUpload} alt="file" />
                        {point.secondPart}
                      </>
                    )}
                    {point.thirdPart && (
                      <>
                        <AlertIcon src={filePlus} alt="file" />
                        {point.thirdPart}
                      </>
                    )}
                  </NoticePoint>
                ))}
              </NoticePoints>
            </React.Fragment>
          ))}

          <ButtonContainer>
            {CLAIM_IMPORTANT_NOTICE.buttons?.map((button, index) => (
              <Button
                key={index}
                variantType={index === 0 ? "primary" : "secondary"}
                onClick={() => {
                  if (button.action === "navigate-policies") {
                    navigate("/policies");
                    handleClose();
                  } else if (button.action === "upload-claims") {
                    onUploadClaims?.();
                    handleClose();
                  }
                }}
              >
                {button.text}
              </Button>
            ))}
          </ButtonContainer>
        </PopoverContainer>
      </MUIPopover>
    </>
  );
};

export default ClaimsLinkPopover;
