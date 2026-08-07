/**
 * Singleton Puppeteer browser pool.
 *
 * - Keeps one browser instance alive and reuses it across requests
 *   (avoids 2–4s cold start per request).
 * - withPage() always closes the page in a finally block — even on timeout
 *   or error — preventing memory leaks from dangling pages.
 * - Blocks images, fonts, media, and stylesheets to make crawls ~60% faster.
 * - Passes windowsHide: true so no CMD window appears on Windows.
 */

type Browser = any;
type Page = any;
type HTTPRequest = any;

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const puppeteerModule = await import("puppeteer");
  const puppeteer = puppeteerModule.default || puppeteerModule;

  const launchOptions = {
    headless: "shell" as any,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--window-size=1,1",
      "--window-position=-9999,-9999",
    ],
    // Hides the CMD window on Windows
    spawnOptions: {
      windowsHide: true,
    } as any,
  };

  try {
    browserInstance = await puppeteer.launch(launchOptions);
  } catch (err: any) {
    console.warn(`[Browser Pool] Modern headless launch failed (${err.message}). Falling back to headless: true...`);
    launchOptions.headless = true as any;
    browserInstance = await puppeteer.launch(launchOptions);
  }

  // Clean up reference when the browser exits unexpectedly
  browserInstance.on("disconnected", () => {
    browserInstance = null;
  });

  return browserInstance;
}

/**
 * Runs `fn` inside a new browser page and guarantees `page.close()` runs
 * in a finally block — even if fn throws or the outer timeout fires.
 * The browser instance itself is kept alive for reuse.
 */
export async function withPage<T>(
  fn: (page: Page) => Promise<T>
): Promise<T> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  // Block heavy assets — not needed for scraping
  await page.setRequestInterception(true);
  page.on("request", (req: HTTPRequest) => {
    const type = req.resourceType();
    if (["image", "font", "media", "stylesheet"].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    return await fn(page);
  } finally {
    await page.close().catch(() => {}); // always close the page
  }
}
