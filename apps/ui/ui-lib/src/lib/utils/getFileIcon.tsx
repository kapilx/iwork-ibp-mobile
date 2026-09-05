import excelIcon from "../assets/pngs/placeholder-icon.png";
import wordIcon from "../assets/svgs/word-icon.svg";
import pptIcon from "../assets/svgs/pp-icon.svg"; // PowerPoint icon
import videoIcon from "../assets/svgs/video-icon.svg";
import audioIcon from "../assets/svgs/audio-icon.svg";
import pdfIcon from "../assets/svgs/pdf-icon.svg"; // PDF icon
import htmlIcon from "../assets/pngs/placeholder-icon.png";
import urlIcon from "../assets/svgs/url-icon.svg";
import zipIcon from "../assets/pngs/placeholder-icon.png";
import defaultIcon from "../assets/pngs/placeholder-icon.png";
import { styled } from "@mui/material";

const StyledImg = styled("img")({
  width: "50px",
});

const fileIconMap: Record<string, { src: string; alt: string }> = {
  xls: { src: excelIcon, alt: "Excel file" },
  xlsx: { src: excelIcon, alt: "Excel file" },
  doc: { src: wordIcon, alt: "Word file" },
  docx: { src: wordIcon, alt: "Word file" },
  ppt: { src: pptIcon, alt: "PowerPoint file" },
  pptx: { src: pptIcon, alt: "PowerPoint file" },
  mp4: { src: videoIcon, alt: "Video file" },
  mov: { src: videoIcon, alt: "Video file" },
  mp3: { src: audioIcon, alt: "Audio file" },
  wav: { src: audioIcon, alt: "Audio file" },
  pdf: { src: pdfIcon, alt: "PDF file" },
  html: { src: htmlIcon, alt: "HTML file" },
  htm: { src: htmlIcon, alt: "HTML file" },
  url: { src: urlIcon, alt: "URL link" },
  zip: { src: zipIcon, alt: "Archive file" },
  rar: { src: zipIcon, alt: "Archive file" },
};

export function getFileIcon(extension: string): JSX.Element {
  const ext = extension?.replace(/^\./, "").toLowerCase();
  const icon = fileIconMap[ext] || { src: defaultIcon, alt: "File" };

  return <StyledImg src={icon.src} alt={icon.alt} />;
}
