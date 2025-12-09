import puppeteer from "puppeteer";

// Cambia esta URL por la del Alan Wake
const testUrl =
  process.argv[2] ||
  "https://www.falabella.com/falabella-cl/product/17548829/Juego-Ps5-Ghost-Of-Yotei-Lat-Sony/17548829";

console.log("🔍 Analizando estructura de precios en Falabella...\n");
console.log("URL:", testUrl, "\n");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  );
  await page.setViewport({ width: 1920, height: 1080 });

  console.log("📄 Navegando a la página...");

  try {
    await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 30000 });

    console.log("⏳ Esperando que cargue el contenido...\n");
    await page.waitForSelector('[class*="copy"], [class*="price"]', {
      timeout: 10000,
    });

    // Extraer TODOS los precios
    const allPrices = await page.evaluate(() => {
      const results = [];

      // Buscar elementos con clases que contengan "copy" y números
      document.querySelectorAll('[class*="copy"]').forEach((el, idx) => {
        const text = el.textContent.trim();
        // Solo si parece un precio (tiene $ o números grandes)
        if (text.includes("$") || /\d{3,}/.test(text)) {
          const hasPrice = /\$\s*[\d.,]+/.test(text);
          const priceMatch = text.match(/\$\s*([\d.,]+)/);
          const extractedPrice = priceMatch
            ? parseInt(priceMatch[1].replace(/\D/g, ""))
            : null;

          results.push({
            index: idx,
            type: "copy-class",
            text: text,
            hasPrice: hasPrice,
            extractedPrice: extractedPrice,
            classes: el.className,
            tagName: el.tagName,
            html: el.outerHTML.substring(0, 300),
          });
        }
      });

      // Buscar elementos que contengan "price" en su clase
      document.querySelectorAll('[class*="price"]').forEach((el, idx) => {
        const text = el.textContent.trim();
        if (text.includes("$") || /\d{3,}/.test(text)) {
          const priceMatch = text.match(/\$\s*([\d.,]+)/);
          const extractedPrice = priceMatch
            ? parseInt(priceMatch[1].replace(/\D/g, ""))
            : null;

          results.push({
            index: idx,
            type: "price-class",
            text: text,
            extractedPrice: extractedPrice,
            classes: el.className,
            tagName: el.tagName,
            html: el.outerHTML.substring(0, 300),
          });
        }
      });

      return results;
    });

    console.log("💰 PRECIOS ENCONTRADOS:\n");
    console.log("=".repeat(100));

    allPrices.forEach((price, idx) => {
      console.log(`\n[${idx + 1}] Tipo: ${price.type}`);
      console.log(`    Tag: ${price.tagName}`);
      console.log(`    Texto completo: "${price.text}"`);
      console.log(`    Tiene formato precio: ${price.hasPrice ? "✅" : "❌"}`);
      console.log(
        `    Precio extraído: ${
          price.extractedPrice
            ? price.extractedPrice.toLocaleString("es-CL")
            : "❌ No se pudo extraer"
        }`
      );
      console.log(`    Clases: ${price.classes}`);
      console.log(`    HTML: ${price.html}...`);
    });

    console.log("\n" + "=".repeat(100));
    console.log(`\n✅ Total de elementos encontrados: ${allPrices.length}`);

    // Filtrar solo los que son precios válidos
    const validPrices = allPrices.filter(
      (p) => p.extractedPrice && p.extractedPrice > 1000
    );
    console.log(`✅ Precios válidos (> $1.000): ${validPrices.length}\n`);

    if (validPrices.length > 0) {
      console.log("📊 Precios válidos encontrados:");
      validPrices.forEach((p, idx) => {
        console.log(
          `   ${idx + 1}. ${p.extractedPrice.toLocaleString("es-CL")} - ${
            p.type
          }`
        );
      });
    }

    await page.screenshot({
      path: "falabella-debug.png",
      fullPage: true,
    });
    console.log("\n📸 Screenshot guardado en: falabella-debug.png\n");

    console.log("🔍 Presiona Ctrl+C para cerrar el navegador...");
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await browser.close();
  }
})();
