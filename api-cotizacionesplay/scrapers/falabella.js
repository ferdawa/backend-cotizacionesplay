import puppeteer from "puppeteer-extra"; // Usamos puppeteer-extra en vez de puppeteer-core directo
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

// Activamos el modo sigilo
puppeteer.use(StealthPlugin());

export async function scrapeFalabella(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Falabella: ${url}`);

    // Configuración para Render con Stealth
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled", // Truco extra para evitar detección
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // User Agent rotativo simple (versión más moderna)
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // Navegar
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });

    // Diagnóstico: Ver qué título tiene la página antes de buscar el selector
    const pageTitle = await page.title();
    console.log(`📄 Título de la página cargada: "${pageTitle}"`);

    // Esperar al selector
    try {
      await page.waitForSelector(
        '[class*="price"], .copy14, [data-testid*="price"]',
        { timeout: 15000 }
      );
    } catch (e) {
      // Si falla, imprimimos el contenido del body para saber qué nos mostró Falabella
      const bodyText = await page.evaluate(() =>
        document.body.innerText.substring(0, 200)
      );
      console.error(
        `⚠️ Timeout esperando selector. Texto visible en la página: "${bodyText.replace(
          /\n/g,
          " "
        )}..."`
      );
      throw e; // Relanzamos el error para que vaya al catch principal
    }

    const priceData = await page.evaluate(() => {
      const selectors = [
        '[data-testid="pod-price"]',
        '[class*="prices-module_price"]',
        'span[class*="copy14"]',
        '[class*="price-"]',
        'li[class*="prices"]',
      ];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          const text = element.textContent.trim();
          // Limpieza agresiva de caracteres no numéricos
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return { price, rawText: text, selector };
          }
        }
      }
      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("Selector encontrado pero precio no extraído.");
    }

    console.log(
      `✅ Precio encontrado: $${priceData.price.toLocaleString("es-CL")}`
    );

    return {
      store: "Falabella",
      price: priceData.price,
      currency: "CLP",
      url,
      scrapedAt: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    // Error handling simplificado
    console.error(`❌ Error final Falabella: ${error.message}`);
    return {
      store: "Falabella",
      price: null,
      error: error.message,
      url,
      success: false,
    };
  } finally {
    if (browser) await browser.close();
  }
}
