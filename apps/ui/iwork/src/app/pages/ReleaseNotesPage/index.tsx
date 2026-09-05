import { useEffect, useState } from "react";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import {
  ReleaseNotesContainer,
  MarkDownContainer,
  ReleaseNoteStyledTypography,
} from "./styles.js";
import { RELEASE_NOTES } from "../../constants/index.js";

const ReleaseNotes = () => {
  const [markdownContent, setMarkdownContent] = useState<string>("");

  useEffect(() => {
    fetch("/README-Release-Notes.md")
      .then((res) => res.text())
      .then((text) => setMarkdownContent(text))
      .catch((error) => {
        console.error("Failed to fetch release notes:", error);
        setMarkdownContent(
          "Error loading release notes. Please try again later."
        );
      });
  }, []);

  return (
    <ReleaseNotesContainer>
      <ReleaseNoteStyledTypography>{RELEASE_NOTES}</ReleaseNoteStyledTypography>
      <MarkDownContainer>
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            details: ({ node, ...props }) => <details {...props} />,
            summary: ({ node, ...props }) => <summary {...props} />,
          }}
        >
          {markdownContent}
        </ReactMarkdown>
      </MarkDownContainer>
    </ReleaseNotesContainer>
  );
};

export default ReleaseNotes;
