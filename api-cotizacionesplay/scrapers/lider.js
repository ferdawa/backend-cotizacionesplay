import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export async function scrapeLider(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Líder: ${url}`);

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080",
      ],
    });

    const page = await browser.newPage();

    // Ocultar que es un navegador automatizado
    await page.evaluateOnNewDocument(() => {
      // Ocultar webdriver
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Simular plugins
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Simular idiomas
      Object.defineProperty(navigator, "languages", {
        get: () => ["es-CL", "es", "en-US", "en"],
      });

      // Ocultar Chrome automation
      window.chrome = {
        runtime: {},
      };
    });

    // User agent para parecer un navegador real
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Headers adicionales
    await page.setExtraHTTPHeaders({
      "Accept-Language": "es-CL,es;q=0.9,en-US;q=0.8,en;q=0.7",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "sec-ch-ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
    });

    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Navegar a la página
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Esperar tiempo adicional para que JavaScript termine de cargar
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Scroll para activar lazy loading
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Intentar esperar a que cargue el precio (no es crítico si falla)
    try {
      await page.waitForSelector(
        '[itemprop="price"], [data-fs-element="price"], [data-testid="price-wrap"], span.black',
        {
          timeout: 15000,
        }
      );
    } catch (e) {
      console.log(
        "⚠️ No se encontraron selectores conocidos en Líder, intentando búsqueda alternativa..."
      );
      // Intentar esperar un poco más
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Debug: Ver qué hay en la página
    const pageContent = await page.content();
    const hasPrice = pageContent.includes('itemprop="price"');
    const hasBlack = pageContent.includes('class="black"');
    console.log(
      `📊 Debug Líder - itemprop="price": ${hasPrice}, class="black": ${hasBlack}`
    );

    // Extraer el precio
    const priceData = await page.evaluate(() => {
      // PRIORIDAD 1: Buscar por itemprop="price" con data-seo-id="hero-price"
      const heroPriceElement = document.querySelector(
        '[itemprop="price"][data-seo-id="hero-price"]'
      );
      if (heroPriceElement) {
        const text = heroPriceElement.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: '[itemprop="price"][data-seo-id="hero-price"]',
            method: "hero-price-itemprop",
          };
        }
      }

      // PRIORIDAD 2: Buscar por data-fs-element="price"
      const fsElementPrice = document.querySelector(
        '[data-fs-element="price"]'
      );
      if (fsElementPrice) {
        const text = fsElementPrice.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: '[data-fs-element="price"]',
            method: "fs-element-price",
          };
        }
      }

      // PRIORIDAD 3: Buscar dentro de data-testid="price-wrap"
      const priceWrap = document.querySelector('[data-testid="price-wrap"]');
      if (priceWrap) {
        const priceElement = priceWrap.querySelector('[itemprop="price"]');
        if (priceElement) {
          const text = priceElement.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return {
              price,
              rawText: text,
              selector: '[data-testid="price-wrap"] [itemprop="price"]',
              method: "price-wrap-itemprop",
            };
          }
        }
      }

      // PRIORIDAD 4: Buscar cualquier elemento con itemprop="price"
      const allPriceElements = document.querySelectorAll('[itemprop="price"]');
      for (const element of allPriceElements) {
        const text = element.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: '[itemprop="price"]',
            method: "any-itemprop-price",
          };
        }
      }

      // PRIORIDAD 5: Buscar en elementos con clase "black" o "dark-gray" que parezcan precios
      const potentialPrices = document.querySelectorAll(".black, .dark-gray");
      for (const element of potentialPrices) {
        const text = element.textContent.trim();
        // Verificar que contenga $ y números
        if (text.includes("$") && /\d{3,}/.test(text)) {
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return {
              price,
              rawText: text,
              selector: ".black, .dark-gray (price pattern)",
              method: "class-based-search",
            };
          }
        }
      }

      return null;
    });

    if (!priceData || !priceData.price) {
      // Guardar screenshot para debug
      const screenshotPath = path.join(process.cwd(), "debug-lider.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot guardado en: ${screenshotPath}`);

      // Guardar el HTML para debug
      const htmlPath = path.join(process.cwd(), "debug-lider.html");
      const html = await page.content();
      fs.writeFileSync(htmlPath, html);
      console.log(`📄 HTML guardado en: ${htmlPath}`);

      throw new Error("No se pudo extraer el precio de Líder");
    }

    console.log(
      `✅ Precio encontrado en Líder: $${priceData.price.toLocaleString(
        "es-CL"
      )} (método: ${priceData.method})`
    );

    return {
      store: "Líder",
      price: priceData.price,
      currency: "CLP",
      url,
      scrapedAt: new Date().toISOString(),
      success: true,
      debug: {
        rawText: priceData.rawText,
        selector: priceData.selector,
        method: priceData.method,
      },
    };
  } catch (error) {
    console.error("❌ Error scraping Líder:", error.message);

    return {
      store: "Líder",
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
