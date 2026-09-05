import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ZoomIn, ZoomOut } from "@mui/icons-material";
import { CustomModal } from "@ui/ui-lib";
import {
  MarkdownContent,
  MarkdownExportContent,
  MarkdownExportWrapper,
  MarkdownModalCenter,
  MarkdownMutedText,
  MarkdownPreviewWrapper,
  MarkdownPreviewScrollArea,
  MarkdownRendererContainer,
  ModalHeadingImage,
  ModalHeadingTitle,
  ModalContainer
} from "./styles";
import closeIcon from '../../../assets/svgs/preview-icon.svg';
import documentUploadIcon from "../../assets/svgs/file-icon-blue.svg";
import {
  ModalFooter,
  ModalFooterLeftSection,
  ModalFooterRightSection,
  ZoomButton,
  DownloadButton,
  ModalHeader,
  ModalTitleRow,
  ModalTitle,
} from "../../pages/MyDocuments/styles";
import { Box, Typography, styled } from "@mui/material";

interface MarkDownRendererProps {
  markdownText: string;
  open: boolean;
  onClose: () => void;
  fileName?: string;
  navitageText?: string;
  onNavigate?: () => void;
  preview?: string;
}

const MarkDownRenderer: React.FC<MarkDownRendererProps> = ({
  markdownText,
  open,
  onClose,
  fileName = "document",
  navitageText,
  onNavigate,
  preview = "Preview",
}) => {
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));

  const handleDownload = async () => {
    if (!exportRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const images = Array.from(exportRef.current.querySelectorAll("img"));
      await Promise.all(
        images.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
                return;
              }
              const onDone = () => resolve();
              img.addEventListener("load", onDone, { once: true });
              img.addEventListener("error", onDone, { once: true });
            }),
        ),
      );

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#FFFFFF",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${fileName}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <MarkdownRendererContainer>
      <CustomModal
        open={open}
        handleClose={onClose}
        heading={
          <ModalContainer>
              <ModalHeadingImage src={closeIcon} alt="Close Icon" />
              <ModalHeadingTitle>{preview}</ModalHeadingTitle>
          </ModalContainer>    
        }
        modalBoxStyles={{
          maxWidth: "90%",
          width: "85%",
          height: "90vh",
          maxHeight: "90vh",
          padding: 0,
          overflow: "hidden",
        }}
        noPadding={true}
      >
        <MarkdownPreviewScrollArea>
          <MarkdownPreviewWrapper $zoom={zoom}>
            <MarkdownContent>
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {markdownText}
              </ReactMarkdown>
            </MarkdownContent>
          </MarkdownPreviewWrapper>
        </MarkdownPreviewScrollArea>
        
        <ModalFooter>
          <ModalFooterLeftSection>
            <ZoomButton
              variant="outlined"
              size="small"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              startIcon={<ZoomIn />}
            >
              Zoom In
            </ZoomButton>
            <ZoomButton
              variant="outlined"
              size="small"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              startIcon={<ZoomOut />}
            >
              Zoom Out
            </ZoomButton>
            <MarkdownMutedText variant="body2">{zoom}%</MarkdownMutedText>
          </ModalFooterLeftSection>

          <MarkdownModalCenter>
            <MarkdownMutedText variant="body2">Page 1 of 1</MarkdownMutedText>
          </MarkdownModalCenter>

          <ModalFooterRightSection>
            <DownloadButton
              variant={navitageText ? "outlined" : "contained"}
              size="small"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? "Downloading..." : "Download"}
            </DownloadButton>
            {navitageText && onNavigate ? (
              <DownloadButton
                variant="contained"
                size="small"
                onClick={onNavigate}
                style={{ marginLeft: 8 }}
              >
                {navitageText}
              </DownloadButton>
            ) : null}
          </ModalFooterRightSection>
        </ModalFooter>
      </CustomModal>

      <MarkdownExportWrapper ref={exportRef}>
        <MarkdownExportContent>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
          >
            {markdownText}
          </ReactMarkdown>
        </MarkdownExportContent>
      </MarkdownExportWrapper>
    </MarkdownRendererContainer>
  );
};

export default MarkDownRenderer;
