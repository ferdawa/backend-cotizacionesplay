import puppeteer from "puppeteer";

const testUrl = "https://www.weplay.cl/preventa-ghost-of-yotei-ps5.html";

console.log("🔍 Analizando estructura de precios en Weplay...\n");

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Abre el navegador para que veas qué pasa
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  );
  await page.setViewport({ width: 1920, height: 1080 });

  console.log("📄 Navegando a:", testUrl);
  await page.goto(testUrl, { waitUntil: "networkidle2", timeout: 30000 });

  console.log("⏳ Esperando que cargue el contenido...\n");
  await page.waitForSelector(".price-wrapper, .price, .product-info-price", {
    timeout: 10000,
  });

  // Extraer TODOS los precios y su HTML
  const allPrices = await page.evaluate(() => {
    const results = [];

    // Buscar todos los elementos con data-price-amount
    document.querySelectorAll("[data-price-amount]").forEach((el, idx) => {
      results.push({
        index: idx,
        type: "data-price-amount",
        price: el.getAttribute("data-price-amount"),
        priceType: el.getAttribute("data-price-type"),
        text: el.textContent.trim(),
        classes: el.className,
        html: el.outerHTML.substring(0, 200),
      });
    });

    // Buscar elementos con clase "special-price"
    document.querySelectorAll(".special-price").forEach((el, idx) => {
      results.push({
        index: idx,
        type: "special-price",
        text: el.textContent.trim(),
        classes: el.className,
        html: el.outerHTML.substring(0, 200),
      });
    });

    // Buscar elementos con clase "old-price" o "regular-price"
    document
      .querySelectorAll(".old-price, .regular-price")
      .forEach((el, idx) => {
        results.push({
          index: idx,
          type: "old-price",
          text: el.textContent.trim(),
          classes: el.className,
          html: el.outerHTML.substring(0, 200),
        });
      });

    return results;
  });

  console.log("💰 PRECIOS ENCONTRADOS:\n");
  console.log("=".repeat(80));

  allPrices.forEach((price, idx) => {
    console.log(`\n[${idx + 1}] Tipo: ${price.type}`);
    console.log(`    Precio: ${price.price || "N/A"}`);
    console.log(`    Tipo de precio: ${price.priceType || "N/A"}`);
    console.log(`    Texto: ${price.text}`);
    console.log(`    Clases: ${price.classes}`);
    console.log(`    HTML: ${price.html}...`);
  });

  console.log("\n" + "=".repeat(80));
  console.log(
    `\n✅ Total de elementos de precio encontrados: ${allPrices.length}\n`
  );

  // Tomar screenshot para inspección visual
  await page.screenshot({
    path: "weplay-debug.png",
    fullPage: true,
  });
  console.log("📸 Screenshot guardado en: weplay-debug.png\n");

  console.log("🔍 Presiona Ctrl+C para cerrar el navegador...");

  // Mantener el navegador abierto para inspección manual
  await new Promise((resolve) => setTimeout(resolve, 60000));

  await browser.close();
})();
