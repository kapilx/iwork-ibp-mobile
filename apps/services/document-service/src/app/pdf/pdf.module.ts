import { Module, OnApplicationShutdown, Inject } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PdfController } from "./pdf.controller";
import { PdfService } from "./pdf.service";
import { PdfRepository } from "./pdf.repository";
import { PuppeteerProvider, PUPPETEER_BROWSER } from "./pdf.providers";
import {
  Policy,
  OpportunityActivityMap,
} from "../../../../service-lib/src/lib/entities";
import type { Browser } from "puppeteer-core";

@Module({
  imports: [TypeOrmModule.forFeature([Policy, OpportunityActivityMap])],
  controllers: [PdfController],
  providers: [PdfService, PdfRepository, PuppeteerProvider],
  exports: [PdfService],
})
export class PdfModule implements OnApplicationShutdown {
  constructor(
    @Inject(PUPPETEER_BROWSER)
    private readonly browser: Browser
  ) {}

  async onApplicationShutdown() {
    if (this.browser) {
      console.log("[Puppeteer] Closing browser...");
      await this.browser.close();
    }
  }
}
