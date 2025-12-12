import { scrapeLider } from "./scrapers/lider.js";

// URL de prueba - Ghost of Yotei en Líder
const testUrl =
  process.argv[2] ||
  "https://www.lider.cl/ip/videojuegos/sony-juego-ghost-of-yot-ps5/00071171959787";

console.log("🧪 Probando scraper de Líder...\n");
console.log("URL:", testUrl, "\n");

scrapeLider(testUrl)
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
