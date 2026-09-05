import { Provider } from "@nestjs/common";
import puppeteer, { Browser } from "puppeteer-core";

export const PUPPETEER_BROWSER = "PUPPETEER_BROWSER";

export const PuppeteerProvider: Provider = {
  provide: PUPPETEER_BROWSER,
  useFactory: async (): Promise<Browser> => {
    const executablePath = process.env.CHROMIUM_PATH || 
                          process.env.PUPPETEER_EXECUTABLE_PATH || 
                          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    
    console.log("[Puppeteer] Using browser at:", executablePath);
    
    const browser: Browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-gpu",
        "--disable-software-rasterizer",
      ],
      headless: true,
      defaultViewport: null,
      executablePath: executablePath,
      protocolTimeout: 300000,
    });

    console.log("[Puppeteer] Browser initialized successfully ✅");
    return browser;
  },
};
