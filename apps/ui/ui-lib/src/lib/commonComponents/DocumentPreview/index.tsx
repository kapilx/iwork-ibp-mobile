import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";
import Button from "../Button";
import downloadIcon from "../../assets/svgs/download-icon.svg";
import { apiRequest } from "../../utils/apiRequest";
import { endPoints } from "../../constants/endPoints";
import useHasPermission from "../../rbac/useHasPermission";
import { FeatureKey } from "../../rbac/permissionMap";
import { environment } from "@ui/ui-lib/environment";
import {
  CenteredState,
  ErrorText,
  FileMeta,
  PagesColumn,
  PdfCanvasContainer,
  PdfPageFrame,
  PreviewContentArea,
  PreviewContainer,
  PreviewSurface,
  Toolbar,
  ZoomLayer,
  ZoomLayoutWrapper,
} from "./styles";
import { theme } from "@ui/ui-lib/styles";

GlobalWorkerOptions.workerSrc = workerSrc;

export interface DocumentPreviewProps {
  fileName: string;
  fileUrl?: string;
  fileId?: string | number;
  mimeType?: string;
  getFileDownloadUrl?: (id: number) => string;
  onDownload?: () => Promise<void> | void;
  showDownloadButton?: boolean;
  previewHeight?: string | number;
  toolbarPlacement?: "top" | "bottom" | "none";
  showFileMeta?: boolean;
  toolbarAlignment?: "start" | "spread";
  toolbarVariant?: "default" | "modalFooter";
  showPageIndicator?: boolean;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  previewSurfaceMaxHeight?: string | number;
  defaultScale?: number;
  stylesForOuterBorder?: any;
  previewMode?: "pdfjs" | "embed";
  compact?: boolean;
  // Raw PDF bytes, as an alternative to fileUrl. When provided, pdf.js loads directly from
  // memory (getDocument({ data })) instead of fetching a URL — avoids pdf.js's worker having to
  // fetch a blob: URL itself, which can fail in some dev-server setups even though the same
  // blob loads fine via a normal <a>/download. Useful when the source bytes were already
  // fetched by the caller (e.g. proxied server-side to work around a third-party CORS gap).
  previewData?: Uint8Array;
}

const PDF_EXTENSIONS = ["pdf"];
const PDF_MIME_TYPES = ["application/pdf"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"];

// FIX: Update PdfPage component to accept scale prop
const PdfPage = React.memo(
  ({
    pageNumber,
    pdf,
    isVisible,
    scale = 1, // Add scale prop
  }: {
    pageNumber: number;
    pdf: PDFDocumentProxy | null;
    isVisible: boolean;
    scale?: number;
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderTaskRef = useRef<RenderTask | null>(null);

    useEffect(() => {
      if (!pdf || !isVisible || !canvasRef.current) return;

      let cancelled = false;

      const render = async () => {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        try {
          const page = await pdf.getPage(pageNumber);
          if (cancelled) return;

          // FIX: Apply the scale to the viewport
          const viewport = page.getViewport({ scale });
          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) return;

          const outputScale = window.devicePixelRatio || 1;
          canvas.width = viewport.width * outputScale;
          canvas.height = viewport.height * outputScale;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const transform =
            outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : undefined;

          const renderTask = page.render({
            canvasContext: context,
            viewport,
            transform,
          });

          renderTaskRef.current = renderTask;
          await renderTask.promise;
        } catch (error: any) {
          if (error?.name !== "RenderingCancelledException") {
            console.error("Error rendering page %s", pageNumber, error);
          }
        } finally {
          if (!cancelled) renderTaskRef.current = null;
        }
      };

      render();

      return () => {
        cancelled = true;
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
      };
    }, [pdf, isVisible, pageNumber, scale]); // FIX: Add scale to dependencies

    return <canvas ref={canvasRef} />;
  }
);

const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileName,
  fileUrl,
  fileId,
  mimeType,
  getFileDownloadUrl = endPoints.fileUploadDownloadById,
  onDownload,
  showDownloadButton = true,
  previewHeight,
  toolbarPlacement = "top",
  showFileMeta = true,
  toolbarAlignment = "spread",
  toolbarVariant = "default",
  showPageIndicator = false,
  primaryActionLabel,
  onPrimaryAction,
  previewSurfaceMaxHeight,
  defaultScale = 1.75,
  stylesForOuterBorder,
  previewMode = "pdfjs",
  compact = false,
  previewData,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const hasRbacPermission = useHasPermission(FeatureKey.EXPORT_DOCUMENT_PREVIEW);
  const isDownloadAllowed = !environment.featureFlag.FF_IWORK_DOCUMENT_DOWNLOAD || hasRbacPermission;

  const objectUrlRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [pageBaseWidth, setPageBaseWidth] = useState<number | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);

  const pageFrameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1]));
  const [pageFramesReady, setPageFramesReady] = useState(false);

  // Default zoom (can be overridden via prop)
  const DEFAULT_SCALE = defaultScale;

  // FIX: Use combined scale for both layout and PDF rendering
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [hasUserAdjustedScale, setHasUserAdjustedScale] = useState(false);

  const ZOOM_STEP = 0.25;
  const ZOOM_STEP_PERCENT = 25;
  const MIN_SCALE = 0.25;
  const MAX_SCALE = 4;

  const scalePercentage = Math.round(scale * 100);

  const zoomSteps = useMemo(
    () =>
      Array.from(
        {
          length:
            Math.floor(
              (MAX_SCALE * 100 - MIN_SCALE * 100) / ZOOM_STEP_PERCENT
            ) + 1,
        },
        (_, idx) => MIN_SCALE * 100 + idx * ZOOM_STEP_PERCENT
      ),
    [MAX_SCALE, MIN_SCALE, ZOOM_STEP_PERCENT]
  );

  const clampScale = useCallback(
    (val: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, val)),
    []
  );

  const getNextZoomScale = useCallback(
    (currentScale: number, direction: "in" | "out") => {
      const currentPercent = currentScale * 100;

      if (direction === "in") {
        const nextPercent =
          zoomSteps.find((step) => step > currentPercent + 0.0001) ??
          MAX_SCALE * 100;
        return clampScale(nextPercent / 100);
      }

      const nextPercent =
        [...zoomSteps]
          .reverse()
          .find((step) => step < currentPercent - 0.0001) ?? MIN_SCALE * 100;
      return clampScale(nextPercent / 100);
    },
    [clampScale, zoomSteps]
  );

  // FIX: Improved zoom change with better anchor point preservation
  const changeScale = useCallback(
    (
      getNextScale: (currentScale: number) => number,
      anchor?: { x: number; y: number }
    ) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      setHasUserAdjustedScale(true);

      setScale((currentScale) => {
        const nextScale = clampScale(getNextScale(currentScale));

        // Get container dimensions
        const { scrollLeft, scrollTop, clientWidth, clientHeight } = container;
        const containerRect = container.getBoundingClientRect();

        let anchorX, anchorY;

        if (anchor) {
          // Mouse-based zoom: convert mouse coordinates to container-relative
          anchorX = anchor.x - containerRect.left;
          anchorY = anchor.y - containerRect.top;
        } else {
          // Center-based zoom
          anchorX = clientWidth / 2;
          anchorY = clientHeight / 2;
        }

        // Calculate the content position relative to the anchor point
        const contentX = (scrollLeft + anchorX) / currentScale;
        const contentY = (scrollTop + anchorY) / currentScale;

        // Calculate new scroll position to keep the same content point under the anchor
        const newScrollLeft = contentX * nextScale - anchorX;
        const newScrollTop = contentY * nextScale - anchorY;

        // Apply changes
        requestAnimationFrame(() => {
          container.scrollTo({
            left: Math.max(0, newScrollLeft),
            top: Math.max(0, newScrollTop),
          });
        });

        return nextScale;
      });
    },
    [clampScale]
  );

  const isPdfType = useMemo(() => {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    return (
      PDF_EXTENSIONS.includes(extension) ||
      (!!mimeType && PDF_MIME_TYPES.includes(mimeType))
    );
  }, [fileName, mimeType]);

  const isImageType = useMemo(() => {
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    return (
      IMAGE_EXTENSIONS.includes(extension) ||
      (!!mimeType && IMAGE_MIME_TYPES.includes(mimeType))
    );
  }, [fileName, mimeType]);

  const sourceUrl = useMemo(() => {
    if (fileUrl) return fileUrl;
    if (fileId !== undefined && fileId !== null) {
      const numericId = Number(fileId);
      if (!Number.isNaN(numericId)) {
        return getFileDownloadUrl(numericId);
      }
    }
    return "";
  }, [fileId, fileUrl, getFileDownloadUrl]);

  const cleanupPreview = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
    setScale(DEFAULT_SCALE);
    setHasUserAdjustedScale(false);
    setPageBaseWidth(null);
    setVisiblePages(new Set([1]));
    setPageFramesReady(false);
  }, [DEFAULT_SCALE]);

  useEffect(() => {
    return () => {
      cleanupPreview();
    };
  }, [cleanupPreview]);

  // FIX: Auto-fit logic - only reset scale if user hasn't manually zoomed
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !pageBaseWidth || hasUserAdjustedScale) return;

    const updateAutoScale = () => {
      const availableWidth = container.clientWidth - 32;
      const autoScale = Math.min(
        DEFAULT_SCALE,
        Math.max(availableWidth / pageBaseWidth, MIN_SCALE)
      );
      setScale(autoScale);
    };

    updateAutoScale();
    const observer = new ResizeObserver(() => updateAutoScale());
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageBaseWidth, hasUserAdjustedScale, DEFAULT_SCALE]);

  // FIX: Wheel zoom handler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();

      const delta = -Math.sign(event.deltaY) * ZOOM_STEP;
      changeScale((currentScale) => currentScale * (1 + delta), {
        x: event.clientX,
        y: event.clientY,
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [changeScale]);

  // Load File (Blob) - unchanged
  useEffect(() => {
    if (!sourceUrl) {
      setError("No file found to preview.");
      return;
    }

    if (!isPdfType && !isImageType) {
      setError("Only PDF, JPEG, and PNG files are supported for preview.");
      return;
    }

    let isCancelled = false;
    const isDataUrl = sourceUrl.startsWith("data:");
    const isBlobUrl = sourceUrl.startsWith("blob:");
    const hasDirectFileUrl = Boolean(fileUrl);

    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      setDownloadError(null);

      try {
        if (isDataUrl || isBlobUrl) {
          if (!isCancelled) setPreviewUrl(sourceUrl);
          return;
        }

        if (hasDirectFileUrl) {
          if (!isCancelled) setPreviewUrl(sourceUrl);
          return;
        }

        const response = await apiRequest(sourceUrl, {
          method: "GET",
          responseType: "blob",
        });
        if (isCancelled) return;

        const blob = response.data as Blob;

        if (!isCancelled) {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setPreviewUrl(url);
        }
      } catch (_err) {
        if (!isCancelled) {
          setError("Unable to load the document preview.");
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      isCancelled = true;
      cleanupPreview();
    };
  }, [cleanupPreview, fileUrl, isPdfType, sourceUrl]);

  // Download Handler - unchanged
  const handleDownload = useCallback(async () => {
    if (onDownload) {
      await onDownload();
    }

    if (!sourceUrl) {
      setDownloadError("No download link found for this file.");
      return;
    }

    try {
      const response = await apiRequest(sourceUrl, {
        method: "GET",
        responseType: "blob",
      });
      const blob = response.data as Blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadError(null);
    } catch (_err) {
      setDownloadError("Unable to download the file right now.");
    }
  }, [fileName, onDownload, sourceUrl]);

  // Initialize PDF Document
  useEffect(() => {
    if ((!previewUrl && !previewData) || !isPdfType) return;

    let cancelled = false;

    const destroyPdf = () => {
      pdfRef.current?.destroy();
      pdfRef.current = null;
    };

    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      setDownloadError(null);
      setPageBaseWidth(null);
      setScale(DEFAULT_SCALE);
      setHasUserAdjustedScale(false);
      setVisiblePages(new Set([1]));
      setPageFramesReady(false);

      try {
        // pdf.js transfers (detaches) the underlying ArrayBuffer to its worker via postMessage —
        // pass a copy so the state-held previewData buffer survives repeated/StrictMode-doubled
        // effect invocations instead of being unusable after the first transfer.
        const loadingTask = previewData
          ? getDocument({ data: previewData.slice() })
          : getDocument({ url: previewUrl as string });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfRef.current = pdf;
        setNumPages(pdf.numPages);

        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        setPageBaseWidth(viewport.width);

        // Auto-fit on initial load
        if (scrollContainerRef.current) {
          const availableWidth = scrollContainerRef.current.clientWidth - 32;
          const autoScale = Math.min(
            DEFAULT_SCALE,
            Math.max(availableWidth / viewport.width, MIN_SCALE)
          );
          setScale(autoScale);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("PDF load error:", err);
          setError("Failed to load PDF file.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      destroyPdf();
    };
  }, [isPdfType, previewUrl, previewData, DEFAULT_SCALE]);

  // Intersection Observer - unchanged
  useEffect(() => {
    if (!previewUrl || !isPdfType || numPages === 0 || !pageFramesReady) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const updated = new Set(prev);
          entries.forEach((entry) => {
            const target = entry.target as HTMLDivElement;
            const pageIndex = Number(target.dataset.pageIndex);

            if (entry.isIntersecting && pageIndex) {
              updated.add(pageIndex);
            }
          });
          return updated;
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "600px 0px",
        threshold: 0,
      }
    );

    pageFrameRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isPdfType, numPages, pageFramesReady, previewUrl]);

  const renderPreviewContent = () => {
    if (previewMode === "embed") {
      return sourceUrl ? (
        <PreviewSurface
          sx={{ maxWidth: "100%", width: "90%", margin: "0 auto" }}
          ref={scrollContainerRef}
          surfaceMaxHeight={previewSurfaceMaxHeight}
          stylesForOuterBorder={stylesForOuterBorder}
        >
          <Box
            component="object"
            data={sourceUrl}
            type={mimeType || "application/pdf"}
            aria-label={fileName}
            sx={{
              width: "100%",
              height: "100%",
              border: 0,
              flex: 1,
            }}
          />
        </PreviewSurface>
      ) : (
        <Typography variant="body2">
          Preview could not be generated for this PDF.
        </Typography>
      );
    }

    if (loading) {
      return (
        <CenteredState>
          <CircularProgress style={{ color: "#399BFC" }} size={32} />
          <Typography variant="body2">Loading preview...</Typography>
        </CenteredState>
      );
    }

    if (error) {
      return (
        <CenteredState>
          <ErrorText variant="body2">{error}</ErrorText>
          <Typography variant="body2">
            Try downloading the file instead.
          </Typography>
        </CenteredState>
      );
    }

    if (!isPdfType && !isImageType) {
      return (
        <CenteredState>
          <Typography variant="body2">
            This file type is not supported for preview. Please download the
            file to view it.
          </Typography>
        </CenteredState>
      );
    }

    if (isImageType && previewUrl) {
      return (
        <PreviewSurface
          ref={scrollContainerRef}
          surfaceMaxHeight={previewSurfaceMaxHeight}
          stylesForOuterBorder={stylesForOuterBorder}
        >
          <Box display="flex" justifyContent="center" alignItems="flex-start" p={2}>
            <img
              src={previewUrl}
              alt={fileName}
              style={{ maxWidth: "100%", height: "auto", display: "block" }}
            />
          </Box>
        </PreviewSurface>
      );
    }

    return previewUrl ? (
      <PreviewSurface
        ref={scrollContainerRef}
        surfaceMaxHeight={previewSurfaceMaxHeight}
        stylesForOuterBorder={stylesForOuterBorder}
      >
        <PdfCanvasContainer surfaceMaxHeight={previewSurfaceMaxHeight}>
          <ZoomLayoutWrapper
            width={
              compact
                ? "min(100%, 760px)"
                : pageBaseWidth
                  ? pageBaseWidth * scale
                  : "100%"
            }
          >
            <ZoomLayer style={{ transform: "none" }}>
              <PagesColumn>
                {Array.from({ length: numPages }).map((_, index) => (
                  <PdfPageFrame
                    key={`page_${index + 1}`}
                    data-page-index={index + 1}
                    ref={(node) => {
                      if (pageFrameRefs.current.length !== numPages) {
                        pageFrameRefs.current = Array(numPages).fill(null);
                      }
                      pageFrameRefs.current[index] = node;

                      if (
                        node &&
                        !pageFramesReady &&
                        pageFrameRefs.current.length === numPages &&
                        pageFrameRefs.current.every((ref) => ref !== null)
                      ) {
                        setPageFramesReady(true);
                      }
                    }}
                  >
                    {/* FIX: Pass scale prop to PdfPage component */}
                    <PdfPage
                      pageNumber={index + 1}
                      pdf={pdfRef.current}
                      isVisible={visiblePages.has(index + 1)}
                      scale={scale} // Pass the current scale to the PDF renderer
                    />

                    <Box px={1} mt={1} display="flex" justifyContent="center">
                      <Typography
                        variant="caption"
                        color={theme.palette.text.primary}
                      >
                        Page {index + 1}
                      </Typography>
                    </Box>
                  </PdfPageFrame>
                ))}
              </PagesColumn>
            </ZoomLayer>
          </ZoomLayoutWrapper>
        </PdfCanvasContainer>
      </PreviewSurface>
    ) : (
      <Typography variant="body2">
        Preview could not be generated for this PDF.
      </Typography>
    );
  };

  const toolbar = (
    toolbarVariant === "modalFooter" ? (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gridTemplateAreas: '"zoom page actions"',
          alignItems: "center",
          gap: 2,
          px: 2,
          py: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: "0px 0px 20px 0px #0000002E",
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          flexShrink: 0,
          "@media (max-width: 463px)": {
            gridTemplateColumns: "1fr 1fr",
            gridTemplateAreas: '"zoom zoom" "page actions"',
            rowGap: 1,
          },
        }}
      >
        <Box
          sx={{ gridArea: "zoom" }}
          display="flex"
          alignItems="center"
          gap={1.5}
          justifySelf="start"
        >
          <Button
            variantType="secondary"
            sizeType="small"
            onClick={() =>
              changeScale((currentScale) =>
                getNextZoomScale(currentScale, "in")
              )
            }
            disabled={scale >= MAX_SCALE}
            startIcon={<ZoomIn fontSize="small" />}
          >
            Zoom In
          </Button>
          <Button
            variantType="secondary"
            sizeType="small"
            onClick={() =>
              changeScale((currentScale) =>
                getNextZoomScale(currentScale, "out")
              )
            }
            disabled={scale <= MIN_SCALE}
            startIcon={<ZoomOut fontSize="small" />}
          >
            Zoom Out
          </Button>
          <Typography variant="body2" color={theme.palette.text.primary}>
            {scalePercentage}%
          </Typography>
        </Box>

        <Box sx={{ gridArea: "page" }} justifySelf="center">
          {showPageIndicator ? (
            <Typography variant="body2" color={theme.palette.text.primary}>
              Page 1 of {numPages}
            </Typography>
          ) : null}
        </Box>

        <Box
          sx={{ gridArea: "actions" }}
          display="flex"
          alignItems="center"
          gap={1.5}
          justifySelf="end"
        >
          {downloadError ? (
            <ErrorText variant="caption">{downloadError}</ErrorText>
          ) : null}
          {showDownloadButton && isDownloadAllowed ? (
            <Button
              variantType="secondary"
              sizeType="small"
              onClick={handleDownload}
              startIcon={
                <img src={downloadIcon} alt="download" width={16} height={16} />
              }
            >
              Download
            </Button>
          ) : null}
          {primaryActionLabel && onPrimaryAction ? (
            <Button
              variantType="primary"
              sizeType="small"
              onClick={onPrimaryAction}
              sx={{
                backgroundColor: "#093F84",
                borderColor: "#093F84",
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "#093F84",
                  borderColor: "#093F84",
                },
              }}
            >
              {primaryActionLabel}
            </Button>
          ) : null}
        </Box>
      </Box>
    ) : (
      <Toolbar
        justifyContent={
          toolbarAlignment === "start" ? "flex-start" : "space-between"
        }
      >
        {showFileMeta && (
          <FileMeta>
            <Typography variant="subtitle1">{fileName}</Typography>
            <Typography variant="caption" color={theme.palette.text.primary}>
              {isPdfType ? "Previewing PDF file" : isImageType ? "Previewing image" : "Unsupported file type"}
            </Typography>
          </FileMeta>
        )}
        <Box
          display="flex"
          alignItems="center"
          gap={1.5}
          flexGrow={showFileMeta ? 0 : 1}
        >
          {showDownloadButton && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Tooltip title="Zoom out">
                <span>
                  <IconButton
                    size="small"
                    onClick={() =>
                      changeScale((currentScale) =>
                        getNextZoomScale(currentScale, "out")
                      )
                    }
                    disabled={scale <= MIN_SCALE}
                    aria-label="Zoom out"
                  >
                    <ZoomOut fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                variant="body2"
                color={theme.palette.text.primary}
                minWidth={48}
                textAlign="center"
              >
                {scalePercentage}%
              </Typography>
              <Tooltip title="Zoom in">
                <span>
                  <IconButton
                    size="small"
                    onClick={() =>
                      changeScale((currentScale) =>
                        getNextZoomScale(currentScale, "in")
                      )
                    }
                    disabled={scale >= MAX_SCALE}
                    aria-label="Zoom in"
                  >
                    <ZoomIn fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
          {showDownloadButton && (
            <Box display="flex" alignItems="center" gap={1.5} marginLeft="auto">
              {downloadError && (
                <ErrorText variant="caption">{downloadError}</ErrorText>
              )}
              {isDownloadAllowed && (
                <Button
                  variantType="secondary"
                  sizeType="small"
                  onClick={handleDownload}
                  startIcon={
                    <img src={downloadIcon} alt="download" width={16} height={16} />
                  }
                >
                  Download
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Toolbar>
    )
  );

  return (
    <PreviewContainer customHeight={previewHeight}>
      {toolbarPlacement === "top" && toolbar}
      <PreviewContentArea>{renderPreviewContent()}</PreviewContentArea>
      {toolbarPlacement === "bottom" && toolbar}
    </PreviewContainer>
  );
};

export default DocumentPreview;
