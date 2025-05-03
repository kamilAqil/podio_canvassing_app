export default defineNuxtConfig({
  css: ["leaflet/dist/leaflet.css", "leaflet-draw/dist/leaflet.draw.css"],

  runtimeConfig: {
    GEOCODER_API_KEY: process.env.GEOCODER_API_KEY,
    PODIO_APP_ID: process.env.PODIO_APP_ID,
    PODIO_APP_TOKEN: process.env.PODIO_APP_TOKEN,
    PODIO_CLIENT_ID: process.env.PODIO_CLIENT_ID,
    PODIO_CLIENT_SECRET: process.env.PODIO_CLIENT_SECRET,
    public: {},
  },

  compatibilityDate: "2025-04-24",
});