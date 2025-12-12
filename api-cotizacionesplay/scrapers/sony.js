import puppeteer from "puppeteer";

export async function scrapeSony(url) {
  let browser;

  try {
    console.log(`🔍 Scraping Sony: ${url}`);

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
    await page.waitForSelector('[class*="labelPrice"], [class*="price"]', {
      timeout: 10000,
    });

    // Extraer el precio (priorizar precio de oferta)
    const priceData = await page.evaluate(() => {
      // PRIORIDAD 1: Buscar precio de oferta en labelPrice (no tachado)
      const offerPriceElements = document.querySelectorAll(
        '[class*="labelPrice"]'
      );
      for (const element of offerPriceElements) {
        // Verificar que NO esté dentro de un elemento con line-through
        const parent = element.closest('[style*="line-through"]');
        const hasLineThrough =
          element.style.textDecoration === "line-through" ||
          element.parentElement?.style.textDecoration === "line-through";

        if (!parent && !hasLineThrough) {
          const text = element.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return {
              price,
              rawText: text,
              selector: '[class*="labelPrice"]',
              method: "offer-price-labelPrice",
              isOffer: true,
            };
          }
        }
      }

      // PRIORIDAD 2: Buscar en containerAvailabilitySummary pero excluir line-through
      const container = document.querySelector(
        '[class*="containerAvailabilitySummary"]'
      );
      if (container) {
        const priceDiv = container.querySelector('[class*="labelPrice"]');
        if (priceDiv) {
          // Verificar que no esté tachado
          const hasLineThrough =
            priceDiv.style.textDecoration === "line-through";
          if (!hasLineThrough) {
            const text = priceDiv.textContent.trim();
            const price = parseInt(text.replace(/\D/g, ""));

            if (price && price > 1000) {
              return {
                price,
                rawText: text,
                selector:
                  '[class*="containerAvailabilitySummary"] [class*="labelPrice"]',
                method: "container-labelPrice",
                isOffer: false,
              };
            }
          }
        }
      }

      // PRIORIDAD 3: Buscar precios construidos con currencyInteger
      const currencyContainers = document.querySelectorAll(
        '[class*="currencyContainer"]'
      );
      for (const container of currencyContainers) {
        // Verificar que NO tenga line-through en el padre
        const parent = container.closest('[style*="line-through"]');
        if (!parent) {
          const integers = container.querySelectorAll(
            '[class*="currencyInteger"]'
          );
          if (integers.length >= 2) {
            // Construir el precio: primera parte + segunda parte
            const firstPart = integers[0].textContent.trim();
            const secondPart = integers[1].textContent.trim();
            const priceStr = firstPart + secondPart;
            const price = parseInt(priceStr);

            if (price && price > 1000) {
              return {
                price,
                rawText: `$${firstPart}.${secondPart}`,
                selector: '[class*="currencyContainer"]',
                method: "currency-integer-parts",
                isOffer: false,
              };
            }
          }
        }
      }

      // PRIORIDAD 4: Buscar cualquier precio que no esté tachado
      const allElements = document.querySelectorAll("div, span");
      const pricePattern = /\$\s*(\d{1,3}(?:\.\d{3})*)/;

      for (const element of allElements) {
        const text = element.textContent.trim();
        const hasLineThrough =
          element.style.textDecoration === "line-through" ||
          element.closest('[style*="line-through"]');

        if (!hasLineThrough && pricePattern.test(text)) {
          const match = text.match(pricePattern);
          if (match) {
            const price = parseInt(match[1].replace(/\D/g, ""));
            if (price && price > 1000) {
              return {
                price,
                rawText: match[0],
                selector: "pattern-search",
                method: "regex-no-linethrough",
                isOffer: false,
              };
            }
          }
        }
      }

      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("No se pudo extraer el precio de Sony");
    }

    console.log(
      `✅ Precio encontrado en Sony: $${priceData.price.toLocaleString(
        "es-CL"
      )} (método: ${priceData.method}${priceData.isOffer ? ", en oferta" : ""})`
    );

    return {
      store: "Sony",
      price: priceData.price,
      currency: "CLP",
      url,
      scrapedAt: new Date().toISOString(),
      success: true,
      debug: {
        rawText: priceData.rawText,
        selector: priceData.selector,
        method: priceData.method,
        isOffer: priceData.isOffer,
      },
    };
  } catch (error) {
    console.error("❌ Error scraping Sony:", error.message);

    return {
      store: "Sony",
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
