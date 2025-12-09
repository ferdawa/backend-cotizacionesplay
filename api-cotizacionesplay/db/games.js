// Base de datos simulada en memoria
// Más adelante puedes migrar a PostgreSQL o MongoDB

export const games = [
  {
    id: 1,
    name: "Ghost of Yotei",
    slug: "ghost-of-yotei",
    platform: "PS5",
    image: "/static/imagenes/PS5 Ghost Of Tushima Cover.png",
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
    image: "/static/imagenes/PS5 Alan Wake 2 Deluxe.png",
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
    name: "God of War Ragnarök",
    slug: "god-of-war-ragnarok",
    platform: "PS5",
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=600&fit=crop",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/videojuego-god-of-war-ragnarok-ps5.html",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/16564459/Videojuego-God-of-War-Ragnarok-PS5/16564459",
      },
    ],
  },
  {
    id: 4,
    name: "Spider-Man 2",
    slug: "spider-man-2",
    platform: "PS5",
    image:
      "https://images.unsplash.com/photo-1531171673193-06a2b44c8e85?w=400&h=600&fit=crop",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/videojuego-marvels-spider-man-2-ps5.html",
      },
      {
        name: "falabella",
        url: "https://www.falabella.com/falabella-cl/product/16906785/Videojuego-Marvel-s-Spider-Man-2-PS5/16906785",
      },
    ],
  },
];

// Cache de precios (simula una tabla de precios)
export const pricesCache = new Map();

// Cooldowns por juego (últimas actualizaciones)
export const lastUpdates = new Map();
