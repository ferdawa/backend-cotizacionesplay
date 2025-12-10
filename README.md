# 🎮 API Cotizaciones Play

API REST para comparar precios de videojuegos PS4 y PS5 en tiendas chilenas. Utiliza web scraping con Puppeteer para obtener precios actualizados de Weplay y Falabella.

## 📋 Características

- ✅ Scraping automático de precios desde múltiples tiendas
- ✅ Sistema de cooldown (5 minutos) para evitar sobrecarga
- ✅ Caché de precios en memoria
- ✅ API RESTful con respuestas JSON
- ✅ Soporte para Weplay y Falabella
- ✅ Fácilmente extensible para agregar nuevas tiendas

## 🚀 Instalación

### Requisitos

- Node.js 16 o superior
- npm o yarn

### Pasos

1. Clona el repositorio:

```bash
git clone <url-del-repositorio>
cd backend-cotizacionesplay
```

2. Instala las dependencias:

```bash
npm install
```

3. Configura las variables de entorno:
   Crea un archivo `.env` en el directorio `api-cotizacionesplay`:

```env
PORT=3001
PUPPETEER_EXECUTABLE_PATH=  # Opcional: para producción (Render/Railway)
```

## 🎯 Uso

### Modo Desarrollo

```bash
npm run dev
```

### Modo Producción

```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## 📡 API Endpoints

### 🏠 Health Check

```
GET /
```

Verifica el estado del servidor y lista los endpoints disponibles.

**Respuesta:**

```json
{
  "status": "online",
  "message": "API Cotizaciones Play",
  "endpoints": {
    "games": "/api/games",
    "gameById": "/api/games/:id",
    "updatePrices": "/api/games/:id/update"
  }
}
```

### 🎮 Obtener todos los juegos

```
GET /api/games
```

Retorna la lista completa de juegos con sus precios cacheados.

**Respuesta:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "Ghost of Yotei",
      "slug": "ghost-of-yotei",
      "platform": "PS5",
      "image": "/static/imagenes/PS5 Ghost Of Yotei Cover.png",
      "prices": [
        {
          "store": "Weplay",
          "price": 59990,
          "currency": "CLP",
          "url": "...",
          "scrapedAt": "2024-11-20T10:30:00.000Z",
          "success": true
        }
      ],
      "lastUpdate": "2024-11-20T10:30:00.000Z"
    }
  ]
}
```

### 🎯 Obtener un juego específico

```
GET /api/games/:id
```

Retorna la información de un juego específico con sus precios.

**Parámetros:**

- `id` (number): ID del juego

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Ghost of Yotei",
    "prices": [...],
    "lastUpdate": "2024-11-20T10:30:00.000Z"
  }
}
```

### 🔄 Actualizar precios de un juego

```
POST /api/games/:id/update
```

Ejecuta el scraping para actualizar los precios de un juego específico.

**Parámetros:**

- `id` (number): ID del juego

**Cooldown:** 5 minutos entre actualizaciones por juego

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "gameId": 1,
    "gameName": "Ghost of Yotei",
    "results": [
      {
        "store": "Weplay",
        "price": 59990,
        "success": true
      }
    ],
    "successfulCount": 2,
    "totalCount": 2,
    "nextUpdateAvailable": "2024-11-20T10:35:00.000Z"
  }
}
```

**Respuesta con cooldown (429):**

```json
{
  "success": false,
  "error": "Por favor espera 3 minutos antes de actualizar nuevamente",
  "remainingMs": 180000,
  "nextUpdateAvailable": "2024-11-20T10:35:00.000Z"
}
```

### 🔄 Actualizar todos los juegos

```
POST /api/update-all
```

Actualiza los precios de todos los juegos (útil para cron jobs).

**Respuesta:**

```json
{
  "success": true,
  "message": "Actualización masiva completada",
  "results": [
    {
      "gameId": 1,
      "gameName": "Ghost of Yotei",
      "successful": 2,
      "total": 2
    }
  ]
}
```

## 🏗️ Estructura del Proyecto

```
api-cotizacionesplay/
├── db/
│   └── games.js          # Base de datos en memoria
├── scrapers/
│   ├── falabella.js      # Scraper para Falabella
│   └── weplay.js         # Scraper para Weplay
├── public/
│   └── static/           # Imágenes de los juegos
├── server.js             # Servidor Express principal
├── package.json
└── .env                  # Variables de entorno
```

## 🛠️ Tecnologías

- **Express** - Framework web para Node.js
- **Puppeteer** - Web scraping y automatización del navegador
- **CORS** - Soporte para Cross-Origin Resource Sharing
- **dotenv** - Gestión de variables de entorno
- **nodemon** - Auto-reinicio en desarrollo

## 🔌 Agregar Nuevas Tiendas

Para agregar soporte para una nueva tienda:

1. Crea un nuevo archivo en `scrapers/nueva-tienda.js`:

```javascript
import puppeteer from "puppeteer";

export async function scrapeNuevaTienda(url) {
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Implementar lógica de scraping específica

    return {
      store: "NuevaTienda",
      price: price,
      currency: "CLP",
      url,
      success: true,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      store: "NuevaTienda",
      success: false,
      error: error.message,
    };
  } finally {
    if (browser) await browser.close();
  }
}
```

2. Importa el scraper en `server.js`:

```javascript
import { scrapeNuevaTienda } from "./scrapers/nueva-tienda.js";
```

3. Agrégalo al flujo de scraping en las rutas correspondientes.

4. Actualiza los juegos en `db/games.js` con la nueva tienda.

## 🚀 Deployment

### Render / Railway

1. Agrega la variable de entorno:

```
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

2. Asegúrate de que el `package.json` incluya:

```json
"scripts": {
  "start": "node server.js"
}
```

### Heroku

Similar a Render, pero usa el buildpack de Puppeteer:

```bash
heroku buildpacks:add jontewks/puppeteer
```

## 📝 Variables de Entorno

| Variable                    | Descripción                  | Valor por defecto              |
| --------------------------- | ---------------------------- | ------------------------------ |
| `PORT`                      | Puerto del servidor          | `3001`                         |
| `PUPPETEER_EXECUTABLE_PATH` | Ruta a Chromium (producción) | `null` (usa instalación local) |

## 🐛 Debugging

Para debuggear el scraping visualmente:

```bash
node api-cotizacionesplay/debug-weplay-prices.js
node api-cotizacionesplay/debug-falabella-prices.js
```

Estos scripts toman capturas de pantalla y guardan el HTML para análisis.

## 📄 Licencia

ISC

## 👥 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-tienda`)
3. Commit tus cambios (`git commit -am 'Agrega scraper para nueva tienda'`)
4. Push a la rama (`git push origin feature/nueva-tienda`)
5. Crea un Pull Request
