import puppeteer from "puppeteer";

export async function scrapeParis(url) {
  let browser;

  try {
    console.log(`🔍 Scraping París: ${url}`);

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
        '[data-testid="paris-text"], h2[class*="ui-text"], .price, [class*="price"]',
        {
          timeout: 10000,
        }
      );
    } catch (e) {
      console.log(
        "⚠️ No se encontraron selectores conocidos, intentando búsqueda alternativa..."
      );
    }

    // DEBUG: Tomar screenshot y obtener HTML
    try {
      await page.screenshot({ path: "debug-paris.png", fullPage: true });
      console.log("📸 Screenshot guardado en debug-paris.png");

      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.log("📄 HTML length:", bodyHTML.length);

      // Buscar cualquier texto que parezca precio en el HTML
      const priceMatches = bodyHTML.match(/\$?\s*\d{1,3}(?:\.\d{3})+/g);
      if (priceMatches) {
        console.log(
          "💰 Precios encontrados en HTML:",
          priceMatches.slice(0, 10)
        );
      }
    } catch (debugError) {
      console.log("⚠️ Error en debug:", debugError.message);
    }

    // Extraer el precio (priorizar precio de oferta)
    const priceData = await page.evaluate(() => {
      // PRIORIDAD 1: Buscar precio de oferta en h2 con data-testid="paris-text"
      const offerPriceH2 = document.querySelector(
        'h2[data-testid="paris-text"]'
      );
      if (offerPriceH2) {
        const text = offerPriceH2.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: 'h2[data-testid="paris-text"]',
            method: "offer-price-h2",
            isOffer: true,
          };
        }
      }

      // PRIORIDAD 2: Buscar precio en cualquier elemento h2 con ui-text-subtitle
      const subtitleH2 = document.querySelector(
        'h2[class*="ui-text-subtitle"]'
      );
      if (subtitleH2) {
        const text = subtitleH2.textContent.trim();
        const price = parseInt(text.replace(/\D/g, ""));

        if (price && price > 1000) {
          return {
            price,
            rawText: text,
            selector: 'h2[class*="ui-text-subtitle"]',
            method: "subtitle-h2",
            isOffer: true,
          };
        }
      }

      // PRIORIDAD 3: Buscar cualquier precio con data-testid="paris-text" (sin line-through)
      const allParisTexts = document.querySelectorAll(
        '[data-testid="paris-text"]'
      );
      for (const element of allParisTexts) {
        // Excluir elementos con line-through (precio tachado)
        const hasLineThrough =
          element.classList.contains("line-through") ||
          element.className.includes("line-through");

        if (!hasLineThrough) {
          const text = element.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));

          if (price && price > 1000) {
            return {
              price,
              rawText: text,
              selector: '[data-testid="paris-text"]:not(.line-through)',
              method: "paris-text-no-linethrough",
              isOffer: false,
            };
          }
        }
      }

      // PRIORIDAD 4: Si hay múltiples precios, tomar el más bajo (excluyendo tachados)
      const allPrices = [];
      document.querySelectorAll('[data-testid="paris-text"]').forEach((el) => {
        const hasLineThrough =
          el.classList.contains("line-through") ||
          el.className.includes("line-through");

        if (!hasLineThrough) {
          const text = el.textContent.trim();
          const price = parseInt(text.replace(/\D/g, ""));
          if (price && price > 1000) {
            allPrices.push({
              price,
              rawText: text,
              element: el,
            });
          }
        }
      });

      if (allPrices.length > 0) {
        const lowest = allPrices.reduce((min, p) =>
          p.price < min.price ? p : min
        );
        return {
          price: lowest.price,
          rawText: lowest.rawText,
          selector: '[data-testid="paris-text"] (lowest)',
          method: "lowest-price",
          isOffer: true,
        };
      }

      // PRIORIDAD 5: Búsqueda amplia en toda la página
      console.log("⚠️ Buscando precio con método alternativo...");
      const bodyText = document.body.innerText;
      const priceRegex = /\$?\s*(\d{1,3}(?:\.\d{3})+)/g;
      const matches = [...bodyText.matchAll(priceRegex)];

      if (matches.length > 0) {
        const prices = matches
          .map((m) => parseInt(m[1].replace(/\./g, "")))
          .filter((p) => p > 10000 && p < 200000); // Filtrar precios razonables para videojuegos

        if (prices.length > 0) {
          const lowestPrice = Math.min(...prices);
          return {
            price: lowestPrice,
            rawText: `$${lowestPrice.toLocaleString("es-CL")}`,
            selector: "body-text-search",
            method: "alternative-search",
            isOffer: false,
          };
        }
      }

      return null;
    });

    if (!priceData || !priceData.price) {
      throw new Error("No se pudo extraer el precio de París");
    }

    console.log(
      `✅ Precio encontrado en París: $${priceData.price.toLocaleString(
        "es-CL"
      )} (método: ${priceData.method}${priceData.isOffer ? ", en oferta" : ""})`
    );

    return {
      store: "París",
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
    console.error("❌ Error scraping París:", error.message);

    return {
      store: "París",
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
