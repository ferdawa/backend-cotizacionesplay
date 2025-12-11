import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function scrapeFalabella(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Falabella: ${url}`);

    // Configuración para Render
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage", // Importante para contenedores con poca memoria
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // 1. OPTIMIZACIÓN: Bloquear carga de recursos pesados e innecesarios
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (
        resourceType === "image" ||
        resourceType === "stylesheet" ||
        resourceType === "font" ||
        resourceType === "media" ||
        resourceType === "other" // A veces bloquea analytics/ads
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // 2. OPTIMIZACIÓN: Cambiar estrategia de espera
    // 'domcontentloaded' dispara mucho antes que 'networkidle2'
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000, // Bajamos a 60s, debería ser suficiente ahora
    });

    // Esperar al selector (esto es lo que realmente importa)
    await page.waitForSelector(
      '[class*="price"], .copy14, [data-testid*="price"]',
      { timeout: 15000 }
    );

    const priceData = await page.evaluate(() => {
      const selectors = [
        '[class*="prices-module_price"]',
        '[data-testid="pod-price"]', // Falabella suele usar este ahora
        ".copy14",
        ".copy12.primary.bold",
        '[class*="price-"]',
        'span[class*="price"]',
        'li[class*="prices"]', // A veces están en listas
      ];

      for (const selector of selectors) {
        // Buscamos todos los elementos por si hay precio normal y precio tarjeta
        const elements = document.querySelectorAll(selector);

        for (const element of elements) {
          const text = element.textContent.trim();
          // Lógica mejorada para limpiar "$", "." y "CLP"
          const price = parseInt(text.replace(/[\$\.CLP\s]/g, ""));

          if (price && price > 1000) {
            // Filtro simple para evitar falsos positivos de $1 o $0
            return {
              price,
              rawText: text,
              selector,
            };
          }
        }
      }
      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("No se pudo extraer el precio (Selector no encontrado)");
    }

    console.log(
      `✅ Precio encontrado en Falabella: $${priceData.price.toLocaleString(
        "es-CL"
      )}`
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
    console.error("❌ Error scraping Falabella:", error.message);
    return {
      store: "Falabella",
      price: null,
      error: error.message,
      url,
      scrapedAt: new Date().toISOString(),
      success: false,
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
