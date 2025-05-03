<template>
  <div>
    <div id="map" style="height: 90vh;"></div>
    <button @click="exportSelected">Export Selected</button>
  </div>
</template>

<script setup>
let L, XLSX
const leads = ref([])
const map = ref(null)
const drawnLayer = ref(null)
const selectedLeads = ref([])

onMounted(async () => {
  if (process.client) {
    // Dynamically import only on client
    L = await import('leaflet').then(m => m.default)
    await import('leaflet-draw')
    XLSX = await import('xlsx')

    const { data } = await useFetch('/api/leads')
    leads.value = data.value || []
    console.log('Fetched leads:', leads.value)

    map.value = L.map('map').setView([33.8121, -117.9190], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map.value)

    const markers = leads.value.map(lead =>
      L.marker([lead.lat, lead.lng])
        .bindPopup(`${lead.address}<br>${lead.status}`)
        .addTo(map.value)
    )

    const drawnItems = new L.FeatureGroup()
    map.value.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        polygon: true
      },
      edit: {
        featureGroup: drawnItems 
      }
    })
    map.value.addControl(drawControl)

    map.value.on('draw:created', function (e) {
      drawnItems.clearLayers()
      drawnItems.addLayer(e.layer)
      const layer = e.layer

      const selected = leads.value.filter(lead =>
        layer.getBounds().contains(L.latLng(lead.lat, lead.lng))
      )

      selectedLeads.value = selected
      console.log('Selected leads:', selected)
    })
  }
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
