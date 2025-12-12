import puppeteer from "puppeteer";

export async function scrapeLider(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Líder: ${url}`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
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
      timeout: 60000,
    });

    // Esperar tiempo adicional para que JavaScript termine de cargar
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Intentar esperar a que cargue el precio (no es crítico si falla)
    try {
      await page.waitForSelector(
        '[itemprop="price"], [data-fs-element="price"], [data-testid="price-wrap"]',
        {
          timeout: 10000,
        }
      );
    } catch (e) {
      console.log(
        "⚠️ No se encontraron selectores conocidos en Líder, intentando búsqueda alternativa..."
      );
    }

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
