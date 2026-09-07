const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("[console.error]", msg.text());
    }
  });
  page.on("pageerror", (err) => {
    console.log("[pageerror]", err.message);
    if (err.stack) console.log("[stack]\n", err.stack);
  });
  page.on("requestfailed", (req) => {
    console.log("[requestfailed]", req.url(), req.failure()?.errorText);
  });

  await page.goto("http://localhost:4308/", { waitUntil: "networkidle2", timeout: 30000 });
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  console.log("BODY_TEXT_SNIPPET:", JSON.stringify(bodyText));
  const rootHtmlLen = await page.evaluate(() => document.getElementById("root")?.innerHTML.length ?? -1);
  console.log("ROOT_INNER_HTML_LENGTH:", rootHtmlLen);
  await new Promise((r) => setTimeout(r, 1500));

  await browser.close();
})().catch((e) => {
  console.error("SCRIPT_FAILURE", e);
  process.exit(1);
});
