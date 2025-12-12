import { scrapeParis } from "./scrapers/paris.js";

// URL de prueba - Minecraft PS4 en París
// Reemplaza con la URL real
const testUrl =
  process.argv[2] || "https://www.paris.cl/minecraft-ps4-XXXXXX.html";

console.log("🧪 Probando scraper de París...\n");
console.log("URL:", testUrl, "\n");

scrapeParis(testUrl)
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
