import puppeteer from "puppeteer";

export async function scrapeWeplay(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Weplay: ${url}`);

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

    // Esperar a que cargue el precio (selector específico de Weplay)
    await page.waitForSelector(
      ".price-wrapper[data-price-amount], span.price",
      {
        timeout: 10000,
      }
    );

    // Extraer el precio (priorizar precio de oferta)
    const priceData = await page.evaluate(() => {
      // PRIORIDAD 1: Buscar precio final explícitamente (data-price-type="finalPrice")
      const finalPriceElement = document.querySelector(
        '[data-price-type="finalPrice"][data-price-amount]'
      );
      if (finalPriceElement) {
        const priceAmount = finalPriceElement.getAttribute("data-price-amount");
        if (priceAmount) {
          return {
            price: parseInt(priceAmount),
            rawText: finalPriceElement.textContent.trim(),
            selector: '[data-price-type="finalPrice"]',
            method: "final-price-attribute",
          };
        }
      }

      // PRIORIDAD 2: Buscar dentro de .special-price
      const specialPriceWrapper = document.querySelector(
        ".special-price [data-price-amount]"
      );
      if (specialPriceWrapper) {
        const priceAmount =
          specialPriceWrapper.getAttribute("data-price-amount");
        if (priceAmount) {
          return {
            price: parseInt(priceAmount),
            rawText: specialPriceWrapper.textContent.trim(),
            selector: ".special-price [data-price-amount]",
            method: "special-price-section",
          };
        }
      }

      // PRIORIDAD 3: Si hay múltiples precios, tomar el más bajo (excluyendo oldPrice)
      const allPriceWrappers = Array.from(
        document.querySelectorAll("[data-price-amount]")
      ).filter((el) => el.getAttribute("data-price-type") !== "oldPrice");

      if (allPriceWrappers.length > 0) {
        let lowestPrice = null;
        let lowestPriceData = null;

        allPriceWrappers.forEach((wrapper) => {
          const priceAmount = parseInt(
            wrapper.getAttribute("data-price-amount")
          );
          if (priceAmount && (!lowestPrice || priceAmount < lowestPrice)) {
            lowestPrice = priceAmount;
            lowestPriceData = {
              price: priceAmount,
              rawText: wrapper.textContent.trim(),
              selector: "[data-price-amount] (lowest)",
              method: "lowest-price-excluding-old",
            };
          }
        });

        if (lowestPriceData) {
          return lowestPriceData;
        }
      }

      // FALLBACK: Buscar cualquier precio con data-price-amount
      const anyPriceWrapper = document.querySelector("[data-price-amount]");
      if (anyPriceWrapper) {
        const priceAmount = anyPriceWrapper.getAttribute("data-price-amount");
        if (priceAmount) {
          return {
            price: parseInt(priceAmount),
            rawText: anyPriceWrapper.textContent.trim(),
            selector: "[data-price-amount]",
            method: "fallback-any-price",
          };
        }
      }

      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("No se pudo extraer el precio de Weplay");
    }

    console.log(
      `✅ Precio encontrado en Weplay: $${priceData.price.toLocaleString(
        "es-CL"
      )} (método: ${priceData.method})`
    );

    return {
      store: "Weplay",
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
    console.error("❌ Error scraping Weplay:", error.message);

    return {
      store: "Weplay",
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
