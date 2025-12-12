import puppeteer from "puppeteer";

export async function scrapeMercadoLibre(url) {
  let browser;

  try {
    console.log(`🔍 Scraping MercadoLibre: ${url}`);

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
      timeout: 30000,
    });

    // Esperar a que cargue el precio
    await page.waitForSelector(
      '.andes-money-amount__fraction, [class*="price"]',
      {
        timeout: 10000,
      }
    );

    // Extraer el precio
    const priceData = await page.evaluate(() => {
      // PRIORIDAD 1: Buscar precio en meta tag (más confiable)
      const metaPrice = document.querySelector('meta[itemprop="price"]');
      if (metaPrice) {
        const priceContent = metaPrice.getAttribute("content");
        const price = parseInt(priceContent);

        if (price && price > 0) {
          return {
            price,
            rawText: `$${price.toLocaleString("es-CL")}`,
            selector: 'meta[itemprop="price"]',
            method: "meta-price",
          };
        }
      }

      // PRIORIDAD 2: Buscar en span.andes-money-amount__fraction
      const fractionElement = document.querySelector(
        ".andes-money-amount__fraction"
      );
      if (fractionElement) {
        const text = fractionElement.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: ".andes-money-amount__fraction",
            method: "fraction-element",
          };
        }
      }

      // PRIORIDAD 3: Buscar precio en el contenedor principal
      const priceContainer = document.querySelector(".ui-pdp-price__part");
      if (priceContainer) {
        const fraction = priceContainer.querySelector(
          ".andes-money-amount__fraction"
        );
        if (fraction) {
          const text = fraction.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return {
              price,
              rawText: text,
              selector: ".ui-pdp-price__part .andes-money-amount__fraction",
              method: "price-container",
            };
          }
        }
      }

      // PRIORIDAD 4: Buscar en cualquier elemento con aria-label que contenga "pesos"
      const allElements = document.querySelectorAll('[aria-label*="peso"]');
      for (const element of allElements) {
        const ariaLabel = element.getAttribute("aria-label");
        const priceMatch = ariaLabel.match(/(\d+)\s*peso/);

        if (priceMatch) {
          const price = parseInt(priceMatch[1]);
          if (price && price > 1000) {
            return {
              price,
              rawText: ariaLabel,
              selector: '[aria-label*="peso"]',
              method: "aria-label",
            };
          }
        }
      }

      // PRIORIDAD 5: Buscar todos los elementos con clase andes-money-amount
      const moneyAmounts = document.querySelectorAll(".andes-money-amount");
      const prices = [];

      moneyAmounts.forEach((el) => {
        const fraction = el.querySelector(".andes-money-amount__fraction");
        if (fraction) {
          const text = fraction.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));
          if (price && price > 1000) {
            prices.push({
              price,
              rawText: text,
              element: el,
            });
          }
        }
      });

      // Tomar el primer precio válido (generalmente es el principal)
      if (prices.length > 0) {
        return {
          price: prices[0].price,
          rawText: prices[0].rawText,
          selector: ".andes-money-amount .andes-money-amount__fraction",
          method: "first-money-amount",
        };
      }

      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("No se pudo extraer el precio de MercadoLibre");
    }

    console.log(
      `✅ Precio encontrado en MercadoLibre: $${priceData.price.toLocaleString(
        "es-CL"
      )} (método: ${priceData.method})`
    );

    return {
      store: "MercadoLibre",
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
    console.error("❌ Error scraping MercadoLibre:", error.message);

    return {
      store: "MercadoLibre",
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
