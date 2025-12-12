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
      {
        name: "mercadolibre",
        urls: [
          {
            url: "https://www.mercadolibre.cl/ghost-of-yotei-standard-edition-formato-fisico-ps5-original/up/MLCU3282964076",
            seller: "Tienda Oficial PlayStation",
          },
          {
            url: "https://www.mercadolibre.cl/edicion-estandar-de-ghost-of-yotei-para-ps5-version-fisica/p/MLC48956943",
            seller: "BESTMARTCL",
          },
          {
            url: "https://www.mercadolibre.cl/ghost-of-yotei-standard-edition-formato-fisico-ps5-original/up/MLCU3284774926",
            seller: "BESTMARTCL",
          },
          {
            url: "https://www.mercadolibre.cl/ghost-of-yotei-standard-edition-formato-fisico-ps5-original/p/MLC60088286",
            seller: "Un Antojito",
          },
          {
            url: "https://www.mercadolibre.cl/ghost-of-yotei-para-ps5-snipercl/up/MLCU3469505444",
            seller: "SniperCL",
          },
        ],
      },
      {
        name: "lider",
        url: "https://www.lider.cl/ip/videojuegos/sony-juego-ghost-of-yot-ps5/00071171959787",
      },
      {
        name: "paris",
        urls: [
          {
            url: "https://www.paris.cl/juego-ps5-ghost-of-yotei-edicion-estandar-273731999.html",
            seller: "Paris",
          },
          {
            url: "https://www.paris.cl/ghost-of-yotei-ps5-MKH9U5AVM5.html",
            seller: "Mathogames Store",
          },
        ],
      },
      {
        name: "sony",
        url: "https://store.sony.cl/ps5-ghost-of-yotei/p",
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
        name: "falabella",
        urls: [
          // <-- Array de URLs con diferentes vendedores
          {
            url: "https://www.falabella.com/falabella-cl/product/143225443/Minecraft-Playstation-4-Euro/143225444",
            seller: "Rivertec", // Nombre del vendedor
          },
        ],
      },
      {
        name: "paris",
        urls: [
          {
            url: "https://www.paris.cl/minecraft-starter-collection-ps4-fisico-sniper-MK2XHV9CH5.html",
            seller: "Sniper",
          },
        ],
      },
      {
        name: "mercadolibre",
        urls: [
          {
            url: "https://www.mercadolibre.cl/minecraft-starter-collection-formato-fisico-ps4-original/p/MLC17975146",
            seller: "Tienda Oficial PlayStation",
          },
        ],
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
  {
    id: 5,
    name: "Minecraft PS5",
    slug: "minecraft-ps5",
    platform: "PS5",
    image: "/static/imagenes/PS5 Minecraft Cover.png",
    stores: [
      {
        name: "weplay",
        url: "https://www.weplay.cl/minecraft-ps5.html",
      },
      {
        name: "falabella",
        urls: [
          {
            url: "https://www.falabella.com/falabella-cl/product/146358423/Juego-Fisico-Minecraft-PS5/146358424",
            seller: "Falabella",
          },
          {
            url: "https://www.falabella.com/falabella-cl/product/146653002/Minecraft-Mojang-PS5-Fisico/146653003",
            seller: "Audiojuegoscl",
          },
        ],
      },
      {
        name: "mercadolibre",
        urls: [
          {
            url: "https://www.mercadolibre.cl/minecraft-mojang-ps5-fisico/p/MLC42462635",
            seller: "GEORGECARO",
          },
        ],
      },
    ],
  },
];

// Cache de precios (simula una tabla de precios)
export const pricesCache = new Map();

// Cooldowns por juego (últimas actualizaciones)
export const lastUpdates = new Map();
