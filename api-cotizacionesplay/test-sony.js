import { scrapeSony } from "./scrapers/sony.js";

// URL de prueba - Ghost of Yotei en Sony
const testUrl = process.argv[2] || "https://store.sony.cl/ps5-ghost-of-yotei/p";

console.log("🧪 Probando scraper de Sony...\n");
console.log("URL:", testUrl, "\n");

scrapeSony(testUrl)
  .then((result) => {
    console.log("\n📊 Resultado:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("\n✅ ¡Scraper funcionando correctamente!");
      console.log(
        `💰 Precio encontrado: $${result.price.toLocaleString("es-CL")}`
      );
      if (result.debug?.isOffer) {
        console.log("🏷️  Este es un precio de oferta");
      }
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
