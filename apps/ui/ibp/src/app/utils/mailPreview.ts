import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type DownloadMailPdfParams = {
  html: string;
  fileName: string;
};

const waitForImages = async (container: HTMLElement) => {
  const images = Array.from(container.querySelectorAll("img"));

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
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120) || "mail-preview";

export const downloadMailPreviewPdf = async ({
  html,
  fileName,
}: DownloadMailPdfParams) => {
  if (!html.trim()) return;

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-100000px";
  container.style.top = "0";
  container.style.width = "1024px";
  container.style.background = "#ffffff";
  container.style.padding = "24px";
  container.style.boxSizing = "border-box";
  container.innerHTML = html;

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const canvas = await html2canvas(container, {
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

    pdf.save(`${sanitizeFileName(fileName)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};

export const getMailPdfFileName = (
  title?: string | null,
  fallback = "mail-preview",
) => sanitizeFileName(title || fallback);
