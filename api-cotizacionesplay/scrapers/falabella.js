import puppeteer from "puppeteer-core"; // Usamos la versión ligera
import chrome from "chrome-aws-lambda"; // Usamos el binario optimizado

export async function scrapeFalabella(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Falabella: ${url}`);

    // 🚨 CONFIGURACIÓN CLAVE PARA RENDER/LAMBDA
    browser = await puppeteer.launch({
      args: chrome.args, // Argumentos optimizados para entornos de servidor
      executablePath: await chrome.executablePath, // Ruta dinámica al binario incluido
      headless: chrome.headless,
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
      timeout: 30000,
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
