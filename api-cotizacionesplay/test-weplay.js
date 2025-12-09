import { scrapeWeplay } from "./scrapers/weplay.js";

// URL de prueba - Ghost of Tsushima en Weplay
const testUrl = "https://www.weplay.cl/preventa-ghost-of-yotei-ps5.html";

console.log("🧪 Probando scraper de Weplay...\n");

scrapeWeplay(testUrl)
  .then((result) => {
    console.log("\n📊 Resultado:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ ¡Scraper funcionando correctamente!");
      console.log(
        `💰 Precio encontrado: $${result.price.toLocaleString("es-CL")}`
      );
    } else {
      console.log("\n❌ Error en el scraper");
      console.log(`Error: ${result.error}`);
    }

    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error crítico:", error);
    process.exit(1);
  });
