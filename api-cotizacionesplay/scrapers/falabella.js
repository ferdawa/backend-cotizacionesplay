import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium"; // <-- Importación del nuevo paquete

export async function scrapeFalabella(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Falabella: ${url}`);

    // 🚨 Configuración actualizada para Render (Node 20+) 🚨
    browser = await puppeteer.launch({
      // Argumentos obligatorios para la ejecución sin sandbox en Render
      args: [...chromium.args, "--hide-scrollbars", "--disable-web-security"],
      // Apunta al ejecutable de Chromium provisto por el paquete
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      // Otras configuraciones
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // User agent para parecer un navegador real
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navegar a la página
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 90000,
    });

    // Esperar a que cargue el precio
    await page.waitForSelector(
      '[class*="price"], .copy14, [data-testid*="price"]',
      {
        timeout: 10000,
      }
    );

    // Extraer el precio
    const priceData = await page.evaluate(() => {
      // Intentar múltiples selectores
      const selectors = [
        '[class*="prices-module_price"]',
        ".copy14",
        ".copy12.primary.bold",
        ".copy12",
        '[data-testid="pod-price"]',
        '[class*="price-"]',
        'span[class*="price"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          // Extraer números del texto
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 0) {
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
      throw new Error("No se pudo extraer el precio");
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
