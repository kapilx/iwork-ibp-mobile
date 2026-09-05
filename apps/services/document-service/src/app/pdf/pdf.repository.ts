import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { readFile, access, constants } from "fs/promises";
import * as path from "path";
import puppeteer, { Browser } from "puppeteer-core";
import { PUPPETEER_BROWSER } from "./pdf.providers";
import {
  uploadToS3,
  getSignedUrl,
} from "../../../../service-lib/src/lib/utils/file-management.utils";

const DATA_INJECTION_MARKER = "<!--DATA_INJECTION_POINT-->";
const TEMPLATE_NAME = "placement-slip.html";
const SRI_LANKA_TEMPLATE_NAME = "sriLanka-placement-slip.html";

const validateInput = (fileName?: string): void => {
  if (!fileName?.trim()) {
    throw new BadRequestException("File name is required and cannot be empty");
  }
};

const validatePayload = (payload?: Record<string, unknown>): void => {
  if (!payload || typeof payload !== "object") {
    throw new BadRequestException("Payload is required and must be an object");
  }
};

/**
 * Sanitizes JSON data for safe injection into HTML script tags
 * Prevents XSS by properly escaping script-breaking characters
 * @param data - The data to be JSON serialized and sanitized
 * @returns Safely escaped JSON string
 */
const sanitizeJsonForHtmlScript = (data: unknown): string => {
  return JSON.stringify(data || {}, null, 2)
    .replace(/</g, "\\u003c")    
    .replace(/>/g, "\\u003e")     
    .replace(/&/g, "\\u0026") 
};

@Injectable()
export class PdfRepository {
  constructor(
    @Inject(PUPPETEER_BROWSER)
    private browser: Browser
  ) {}
  private readonly templatePath = path.resolve(
    __dirname,
    "..",
    "..",
    "document-service/src/app/policy-template",
    TEMPLATE_NAME
  );

  private readonly sriLanakaTemplatePath = path.resolve(
    __dirname,
    "..",
    "..",
    "document-service/src/app/policy-template",
    SRI_LANKA_TEMPLATE_NAME
  );

  private readonly logoPath = path.resolve(
    process.cwd(),
    "apps/ui/iwork/src/app/assets/"
  );

  private readonly alternativeLogoPaths = [
    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "..",
      "apps/ui/iwork/src/app/assets/jpgs/iirm_india_logo.jpg"
    ),
    path.resolve(
      process.cwd(),
      "apps/ui/iwork/src/app/assets/jpgs/iirm_india_logo.jpg"
    ),
    path.resolve(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "ui/iwork/src/app/assets/jpgs/iirm_india_logo.jpg"
    ),
  ];

  async generatePlacementSlipPdf(
    fileName: string,
    payload: Record<string, unknown>,
    organisationName: string
  ): Promise<string[]> {
    try {
      validateInput(fileName);
      validatePayload(payload);
      const template = await this.loadTemplate(organisationName);
      const enrichedPayload = await this.enrichPayloadWithLogo(payload);
      const html = this.injectPayload(template, enrichedPayload);
      const pdfBuffer = await this.renderPdf(html);
      const name = `${fileName.trim()}.pdf`;
      const uploadedUrl = await uploadToS3(pdfBuffer, name, "application/pdf");
      return [uploadedUrl, name];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `PDF generation failed: ${(error as Error).message}`
      );
    }
  }

  private async enrichPayloadWithLogo(
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    try {
      const assets = payload.assets as any;
      if (assets?.logo?.base64) {
        console.log("Logo already exists in payload as base64");
        return payload;
      }

      const logoUrl = payload.FooterSection.logoUrl.split("..")[1];
      // Try to find and validate logo file
      const validLogoPath = await this.findValidLogoPath(logoUrl);
      if (!validLogoPath) {
        console.warn("No valid logo path found, proceeding without logo");
        return this.createPayloadWithPlaceholder(payload);
      }

      // Read and convert logo to base64
      const logoBuffer = await readFile(validLogoPath);
      const logoBase64 = logoBuffer.toString("base64");
      const logoMimeType = this.getImageMimeType(validLogoPath);

      return {
        ...payload,
        assets: {
          ...assets,
          logo: {
            base64: logoBase64,
            mimeType: logoMimeType,
            width: 130,
            height: 48,
            path: undefined, // Remove path since we're using base64
          },
        },
      };
    } catch (error) {
      console.warn("Failed to load logo, proceeding without it:", error);
      return this.createPayloadWithPlaceholder(payload);
    }
  }

  private async findValidLogoPath(logoUrl: string): Promise<string | null> {
    try {
      await access(this.logoPath, constants.F_OK);
      const path = this.logoPath + `${logoUrl}`;
      console.log("Logo file found at primary path:", path);
      return path;
    } catch {
      console.log("Primary logo path not found:", this.logoPath);
    }

    // Try alternative paths
    for (const altPath of this.alternativeLogoPaths) {
      try {
        await access(altPath, constants.F_OK);
        console.log("Logo file found at alternative path:", altPath);
        return altPath;
      } catch {
        console.log("Alternative logo path not found:", altPath);
      }
    }

    return null;
  }

  private createPayloadWithPlaceholder(
    payload: Record<string, unknown>
  ): Record<string, unknown> {
    const assets = payload.assets as any;
    return {
      ...payload,
      assets: {
        ...assets,
        logo: {
          base64: undefined,
          mimeType: undefined,
          width: 130,
          height: 48,
          path: undefined,
        },
      },
    };
  }

  private getImageMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".jpg":
      case ".jpeg":
        return "image/jpeg";
      case ".png":
        return "image/png";
      case ".gif":
        return "image/gif";
      case ".webp":
        return "image/webp";
      case ".svg":
        return "image/svg+xml";
      default:
        return "image/jpeg";
    }
  }

  private async loadTemplate(organisationName: string): Promise<string> {
    try {
      let organisationTemplatePath;
      if (organisationName === "iirm_india") {
        organisationTemplatePath = this.templatePath;
      } else if (organisationName === "iirm_srilanka") {
        organisationTemplatePath = this.sriLanakaTemplatePath;
      }
      // change this for kenya
      else if (organisationName === "iirm_kenya") {
        organisationTemplatePath = this.templatePath;
      } else {
        throw new BadRequestException("Unsupported organisation for template");
      }
      console.log("organisationTemplatePath", organisationTemplatePath);
      const template = await readFile(organisationTemplatePath, "utf8");
      if (!template?.trim()) {
        throw new BadRequestException("Template file is empty");
      }
      return template;
    } catch (error) {
      throw new BadRequestException(
        `Failed to load template: ${(error as Error).message}`
      );
    }
  }

  private injectPayload(
    template: string,
    payload: Record<string, unknown>
  ): string {
    if (!template?.trim()) {
      throw new BadRequestException("Template is empty or invalid");
    }

    // Use enhanced JSON sanitization for XSS prevention
    const serialized = sanitizeJsonForHtmlScript(payload);

    // Replace the {{JSON_SERIALIZED_DATA}} marker in the template with properly escaped JSON
    // This prevents XSS by using comprehensive JSON sanitization (NFR-SEC-016)
    return template.replace("{{JSON_SERIALIZED_DATA}}", serialized);
  }

  private async renderPdf(html: string): Promise<Buffer> {
    if (!html?.trim()) {
      throw new BadRequestException("HTML content is empty");
    }

    if (!this.browser || !this.browser.isConnected()) {
      console.warn("[Puppeteer] Browser disconnected. Relaunching...");
      this.browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--disable-features=AudioServiceOutOfProcess",
          "--disable-gpu",
          "--disable-software-rasterizer",
          // "--single-process",
        ],
        headless: true,

        defaultViewport: null,
        // executablePath:
        //   process.env.CHROMIUM_PATH ||
        //   "/Applications/Chromium.app/Contents/MacOS/Chromium",
        executablePath:
          process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
        protocolTimeout: 300000,
      });
    }

    const page = await this.browser.newPage();
    try {
      await page.setContent(html, {
        waitUntil: ["domcontentloaded"],
        timeout: 3000,
      });
      await page.waitForFunction(
        () => document.body?.getAttribute("data-render-complete") === "true",
        {
          timeout: 20000,
        }
      );
      const buffer = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        timeout: 60000,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      });
      return buffer;
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new BadRequestException(
        `PDF generation failed: ${(error as Error).message}`
      );
    } finally {
      await page.close();
    }
  }

  async fetchPlacementSlipUrl(pathUrl: string): Promise<string> {
    try {
      return await getSignedUrl(pathUrl);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch placement slip URL: ${(error as Error).message}`
      );
    }
  }
}
