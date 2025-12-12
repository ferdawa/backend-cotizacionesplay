import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { games, pricesCache, lastUpdates } from "./db/games.js";
import { scrapeFalabella } from "./scrapers/falabella.js";
import { scrapeWeplay } from "./scrapers/weplay.js";
import { scrapeParis } from "./scrapers/paris.js";
import { scrapeMercadoLibre } from "./scrapers/mercadolibre.js";
import { scrapeLider } from "./scrapers/lider.js";
import { scrapeSony } from "./scrapers/sony.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ==================== RUTAS ====================

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "API Cotizaciones Play",
    endpoints: {
      games: "/api/games",
      gameById: "/api/games/:id",
      updatePrices: "/api/games/:id/update",
    },
  });
});

// Obtener todos los juegos
app.get("/api/games", (req, res) => {
  try {
    // Agregar precios cacheados a cada juego
    const gamesWithPrices = games.map((game) => {
      const cachedPrices = pricesCache.get(game.id) || [];
      const lastUpdate = lastUpdates.get(game.id);

      return {
        ...game,
        prices: cachedPrices,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
      };
    });

    res.json({
      success: true,
      count: gamesWithPrices.length,
      data: gamesWithPrices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Obtener un juego específico
app.get("/api/games/:id", (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    const cachedPrices = pricesCache.get(gameId) || [];
    const lastUpdate = lastUpdates.get(gameId);

    res.json({
      success: true,
      data: {
        ...game,
        prices: cachedPrices,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Actualizar precios de un juego
app.post("/api/games/:id/update", async (req, res) => {
  try {
    const gameId = parseInt(req.params.id);
    const game = games.find((g) => g.id === gameId);

    if (!game) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Verificar cooldown
    const lastUpdate = lastUpdates.get(gameId);
    const now = Date.now();

    if (lastUpdate && now - lastUpdate < COOLDOWN_MS) {
      const remainingMs = COOLDOWN_MS - (now - lastUpdate);
      const remainingMinutes = Math.ceil(remainingMs / 1000 / 60);

      return res.status(429).json({
        success: false,
        error: `Por favor espera ${remainingMinutes} minutos antes de actualizar nuevamente`,
        remainingMs,
        nextUpdateAvailable: new Date(lastUpdate + COOLDOWN_MS).toISOString(),
      });
    }

    console.log(`\n🎮 Actualizando precios para: ${game.name}`);

    // Scraping de todas las tiendas (con soporte para múltiples URLs)
    const scrapingPromises = [];

    for (const store of game.stores) {
      // Verificar si la tienda tiene múltiples URLs (vendedores)
      if (store.urls && Array.isArray(store.urls)) {
        // Scrapear cada vendedor
        for (const sellerInfo of store.urls) {
          if (sellerInfo.url) {
            const promise = (async () => {
              let result;
              if (store.name === "falabella") {
                result = await scrapeFalabella(sellerInfo.url);
              } else if (store.name === "weplay") {
                result = await scrapeWeplay(sellerInfo.url);
              } else if (store.name === "paris") {
                result = await scrapeParis(sellerInfo.url);
              } else if (store.name === "mercadolibre") {
                result = await scrapeMercadoLibre(sellerInfo.url);
              } else if (store.name === "lider") {
                result = await scrapeLider(sellerInfo.url);
              } else if (store.name === "sony") {
                result = await scrapeSony(sellerInfo.url);
              } else {
                return {
                  store: store.name,
                  success: false,
                  error: "Scraper no implementado",
                };
              }

              // Agregar información del vendedor al resultado
              return {
                ...result,
                seller: sellerInfo.seller,
                store: `${store.name} (${sellerInfo.seller})`,
              };
            })();

            scrapingPromises.push(promise);
          }
        }
      } else if (store.url) {
        // URL única (comportamiento anterior)
        const promise = (async () => {
          if (store.name === "falabella") {
            return await scrapeFalabella(store.url);
          }
          if (store.name === "weplay") {
            return await scrapeWeplay(store.url);
          }
          if (store.name === "paris") {
            return await scrapeParis(store.url);
          }
          if (store.name === "mercadolibre") {
            return await scrapeMercadoLibre(store.url);
          }
          if (store.name === "lider") {
            return await scrapeLider(store.url);
          }
          if (store.name === "sony") {
            return await scrapeSony(store.url);
          }
          return {
            store: store.name,
            success: false,
            error: "Scraper no implementado",
          };
        })();

        scrapingPromises.push(promise);
      }
    }

    const results = await Promise.all(scrapingPromises);

    // Guardar precios exitosos en el cache
    const successfulPrices = results.filter((r) => r.success);

    if (successfulPrices.length > 0) {
      pricesCache.set(gameId, successfulPrices);
      lastUpdates.set(gameId, now);
    }

    console.log(
      `✅ Actualización completada: ${successfulPrices.length}/${results.length} exitosos\n`
    );

    res.json({
      success: true,
      data: {
        gameId,
        gameName: game.name,
        results,
        successfulCount: successfulPrices.length,
        totalCount: results.length,
        nextUpdateAvailable: new Date(now + COOLDOWN_MS).toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error en actualización:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Actualizar todos los juegos (para cron job)
app.post("/api/update-all", async (req, res) => {
  try {
    console.log("\n🔄 Iniciando actualización masiva...\n");

    const results = [];

    for (const game of games) {
      console.log(`\n📦 Procesando: ${game.name}`);

      const scrapingPromises = [];

      for (const store of game.stores) {
        // Soporte para múltiples URLs por tienda
        if (store.urls && Array.isArray(store.urls)) {
          for (const sellerInfo of store.urls) {
            if (sellerInfo.url) {
              const promise = (async () => {
                let result;
                if (store.name === "falabella") {
                  result = await scrapeFalabella(sellerInfo.url);
                } else if (store.name === "weplay") {
                  result = await scrapeWeplay(sellerInfo.url);
                } else if (store.name === "paris") {
                  result = await scrapeParis(sellerInfo.url);
                } else if (store.name === "mercadolibre") {
                  result = await scrapeMercadoLibre(sellerInfo.url);
                } else if (store.name === "lider") {
                  result = await scrapeLider(sellerInfo.url);
                } else if (store.name === "sony") {
                  result = await scrapeSony(sellerInfo.url);
                } else {
                  return { store: store.name, success: false };
                }
                return {
                  ...result,
                  seller: sellerInfo.seller,
                  store: `${store.name} (${sellerInfo.seller})`,
                };
              })();
              scrapingPromises.push(promise);
            }
          }
        } else if (store.url) {
          const promise = (async () => {
            if (store.name === "falabella") {
              return await scrapeFalabella(store.url);
            }
            if (store.name === "weplay") {
              return await scrapeWeplay(store.url);
            }
            if (store.name === "paris") {
              return await scrapeParis(store.url);
            }
            if (store.name === "mercadolibre") {
              return await scrapeMercadoLibre(store.url);
            }
            if (store.name === "lider") {
              return await scrapeLider(store.url);
            }
            if (store.name === "sony") {
              return await scrapeSony(store.url);
            }
            return { store: store.name, success: false };
          })();
          scrapingPromises.push(promise);
        }
      }

      const gameResults = await Promise.all(scrapingPromises);
      const successfulPrices = gameResults.filter((r) => r.success);

      if (successfulPrices.length > 0) {
        pricesCache.set(game.id, successfulPrices);
        lastUpdates.set(game.id, Date.now());
      }

      results.push({
        gameId: game.id,
        gameName: game.name,
        successful: successfulPrices.length,
        total: gameResults.length,
      });

      // Delay entre juegos para no sobrecargar
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("\n✅ Actualización masiva completada\n");

    res.json({
      success: true,
      message: "Actualización masiva completada",
      results,
    });
  } catch (error) {
    console.error("❌ Error en actualización masiva:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   GET  /api/games`);
  console.log(`   GET  /api/games/:id`);
  console.log(`   POST /api/games/:id/update`);
  console.log(`   POST /api/update-all\n`);
});
