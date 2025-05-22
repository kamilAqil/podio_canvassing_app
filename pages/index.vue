<template>
  <div>
    <div id="map" style="height: 90vh;"></div>
    <button @click="exportSelected">Export Selected</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

let L, XLSX
const leads = ref([])
const map = ref(null)
const selectedLeads = ref([])

function waitFor(check, interval = 100, maxAttempts = 50) {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const timer = setInterval(() => {
      if (check()) {
        clearInterval(timer)
        resolve(true)
      } else if (++attempts > maxAttempts) {
        clearInterval(timer)
        reject(new Error('Timed out waiting for FreeHandShapes'))
      }
    }, interval)
  })
}

onMounted(async () => {
  if (!process.client) return

  L = window.L
  XLSX = await import('xlsx')

  // Fetch API response
  const response = await fetch('/api/leads')
  const result = await response.json()
  console.log('Fetched leads result:', result)

  // If it's an object like { data: [...] }, extract the data
  if (Array.isArray(result)) {
    leads.value = result
  } else if (Array.isArray(result.data)) {
    leads.value = result.data
  } else {
    console.warn('No valid leads found in API response.')
    leads.value = []
  }

  // Fix "Map container already initialized" error
  const mapContainer = document.getElementById('map')
  if (mapContainer && mapContainer._leaflet_id) {
    mapContainer._leaflet_id = null
  }

  // Initialize map
  map.value = L.map('map').setView([33.8121, -117.9190], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  // Add markers
  if (Array.isArray(leads.value)) {
    leads.value.forEach(lead => {
      if (lead.lat && lead.lng) {
        L.marker([lead.lat, lead.lng])
          .bindPopup(`${lead.address}<br>${lead.status}`)
          .addTo(map.value)
      }
    })
  }

  // Drawing setup
  const drawnItems = new L.FeatureGroup()
  map.value.addLayer(drawnItems)

  const freeHandControl = new L.Control.FreeHandShapes({
    position: 'topleft',
    layer: drawnItems,
    multiple: false
  })

  map.value.addControl(freeHandControl)

  map.value.on('freehandshapes.created', (e) => {
  const polygon = e.layer
  drawnItems.clearLayers()
  drawnItems.addLayer(polygon)

  if (!polygon?.getBounds?.()) {
    console.warn('Polygon bounds not available.')
    return
  }

  const bounds = polygon.getBounds()
  const selected = leads.value.filter(lead => {
    const point = L.latLng(lead.lat, lead.lng)
    return bounds.contains(point)
  })

  selectedLeads.value = selected
  console.log('Selected (freehand) leads:', selected)
})

})


function exportSelected() {
  if (selectedLeads.value.length === 0) {
    alert('No leads selected')
    return
  }

  const data = selectedLeads.value.map(lead => ({
    Address: lead.address,
    Status: lead.status,
    ForeclosureDate: lead.foreclosureDate,
    Latitude: lead.lat,
    Longitude: lead.lng
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
  XLSX.writeFile(workbook, 'Selected_Leads.xlsx')
}
</script>

