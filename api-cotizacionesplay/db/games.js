// Base de datos simulada en memoria
// Más adelante puedes migrar a PostgreSQL o MongoDB

export const games = [
  {
    id: 1,
    name: "Ghost of Yotei",
    slug: "ghost-of-yotei",
    platform: "PS5",
    image: "/static/imagenes/PS5 Ghost Of Yotei Cover.png",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/preventa-ghost-of-yotei-ps5.html",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/17548829/Juego-Ps5-Ghost-Of-Yotei-Lat-Sony/17548829",
      },
    ],
  },
  {
    id: 2,
    name: "Alan Wake 2 Deluxe Edition",
    slug: "alan-wake-2-deluxe",
    platform: "PS5",
    image: "/static/imagenes/PS5 Alan Wake 2 Deluxe Cover.png",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/alan-wake-2-deluxe-edition-ps5.html",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/145251235/Alan-Wake-2-Deluxe-Edition-Playstation-5-Ps5-Sniper/145251236",
      },
    ],
  },
  {
    id: 3,
    name: "Minecraft PS4",
    slug: "minecraft-ps4",
    platform: "PS4",
    image: "/static/imagenes/PS4 Minecraft Cover.png",
    stores: [
      {
        name: "weplay",
        url: "",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/143225443/Minecraft-Playstation-4-Euro/143225444",
      },
    ],
  },
  {
    id: 4,
    name: "Helldivers 2",
    slug: "helldivers-2",
    platform: "PS5",
    image: "/static/imagenes/PS5 Helldivers 2 Cover.png",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/preventa-helldivers-2-ps5.html",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/148490943/Helldivers-2-Formato-Fisico-Ps5/148490944",
      },
    ],
  },
];

// Cache de precios (simula una tabla de precios)
export const pricesCache = new Map();

// Cooldowns por juego (últimas actualizaciones)
export const lastUpdates = new Map();
