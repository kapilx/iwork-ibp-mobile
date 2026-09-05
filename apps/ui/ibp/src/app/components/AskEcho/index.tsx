import React, { useState, useEffect } from "react";
import { AskEchoText, AskEchoWrapper,AskEchoImageWrapper } from "./styles";
import Tooltip from "@mui/material/Tooltip";
import AskEchoImage from "../../../assets/svgs/ask-echo-icon.svg";

const AskEcho = () => {
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const checkScrollPosition = () => {
    const atBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    // Create intersection observer for footer
    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1
      }
    );

    observer.observe(footer);

    // Setup scroll listener
    checkScrollPosition();
    window.addEventListener("scroll", checkScrollPosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", checkScrollPosition);
    };
  }, []);

  return (
    <AskEchoWrapper
      isAtBottom={isAtBottom}
    >
      <Tooltip title="Ask Echo" placement="left" arrow>
          <AskEchoImageWrapper
            src={AskEchoImage}
            alt="Ask Echo"
          />
      </Tooltip>
      <AskEchoText>Ask Echo</AskEchoText>
    </AskEchoWrapper>
  );
};

export default AskEcho;