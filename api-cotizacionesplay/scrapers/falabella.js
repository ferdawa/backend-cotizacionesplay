import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

puppeteer.use(StealthPlugin());

export async function scrapeFalabella(url) {
  let browser;
  try {
    console.log(`🔍 Scraping Falabella (Modo JSON-LD): ${url}`);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--hide-scrollbars",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // Bloqueamos imágenes y fuentes para velocidad máxima
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "stylesheet", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navegar y esperar SOLO al DOM (no a la red completa)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });

    // --- ESTRATEGIA 1: METADATOS (JSON-LD) ---
    // Falabella suele poner el precio en un script para Google
    const jsonPrice = await page.evaluate(() => {
      try {
        const scripts = document.querySelectorAll(
          'script[type="application/ld+json"]'
        );
        for (const script of scripts) {
          const data = JSON.parse(script.innerText);
          // A veces es un array, a veces un objeto
          const product = Array.isArray(data) ? data[0] : data;

          if (
            product &&
            (product["@type"] === "Product" ||
              product["@type"] === "SoftwareApplication")
          ) {
            if (product.offers && product.offers.price) {
              return parseInt(product.offers.price);
            }
            if (product.offers && product.offers.lowPrice) {
              return parseInt(product.offers.lowPrice);
            }
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    });

    if (jsonPrice) {
      console.log(`✅ Precio encontrado vía JSON-LD: $${jsonPrice}`);
      return {
        store: "Falabella",
        price: jsonPrice,
        currency: "CLP",
        url,
        scrapedAt: new Date().toISOString(),
        success: true,
      };
    }

    // --- ESTRATEGIA 2: META TAGS (Open Graph) ---
    // Si falla el JSON, buscamos en los meta tags del head
    const metaPrice = await page.evaluate(() => {
      const meta =
        document.querySelector('meta[property="product:price:amount"]') ||
        document.querySelector('meta[property="og:price:amount"]');
      return meta ? parseInt(meta.content) : null;
    });

    if (metaPrice) {
      console.log(`✅ Precio encontrado vía Meta Tags: $${metaPrice}`);
      return {
        store: "Falabella",
        price: metaPrice,
        currency: "CLP",
        url,
        scrapedAt: new Date().toISOString(),
        success: true,
      };
    }

    // --- ESTRATEGIA 3: SELECTORES VISUALES (Fallback) ---
    // Solo si todo lo anterior falla, esperamos un poco más e intentamos leer el HTML
    console.log("⚠️ JSON/Meta falló, intentando selectores visuales...");

    // Esperamos selectores específicos de precio
    try {
      await page.waitForSelector(
        '[data-testid="pod-price"], [class*="prices-module"], .copy10.primary',
        { timeout: 10000 }
      );
    } catch (e) {
      console.log("⚠️ Timeout visual, intentando leer lo que haya...");
    }

    const visualPrice = await page.evaluate(() => {
      // Selectores actualizados
      const selectors = [
        '[data-testid="pod-price"]',
        '[class*="prices-module_price"]', // Clases genéricas
        "span.copy10.primary.medium", // Clases de fuente falabella
        'div[class*="price"]',
      ];

      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (const el of els) {
          const txt = el.innerText;
          const val = parseInt(txt.replace(/\D/g, ""));
          if (val > 1000) return val;
        }
      }
      return null;
    });

    if (!visualPrice)
      throw new Error("No se pudo extraer precio por ningún método");

    console.log(`✅ Precio encontrado visualmente: $${visualPrice}`);
    return {
      store: "Falabella",
      price: visualPrice,
      currency: "CLP",
      url,
      scrapedAt: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error(`❌ Error Falabella: ${error.message}`);
    // Opcional: Tomar screenshot en error (solo si tienes donde guardarlo)
    // await page.screenshot({ path: 'error_falabella.png' });
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
