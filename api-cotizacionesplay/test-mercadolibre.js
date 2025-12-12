import { scrapeMercadoLibre } from "./scrapers/mercadolibre.js";

// URL de prueba - Minecraft PS4 en MercadoLibre
const testUrl =
  process.argv[2] ||
  "https://www.mercadolibre.cl/minecraft-starter-collection-formato-fisico-ps4-original/p/MLC17975146";

console.log("🧪 Probando scraper de MercadoLibre...\n");
console.log("URL:", testUrl, "\n");

scrapeMercadoLibre(testUrl)
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
