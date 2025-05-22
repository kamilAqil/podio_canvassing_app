import { api as Podio } from 'podio-js'
import { eventHandler } from 'h3'

export default eventHandler(async (event) => {
    const config = useRuntimeConfig()

    const podio = new Podio({
        authType: 'app',
        clientId: config.PODIO_CLIENT_ID,
        clientSecret: config.PODIO_CLIENT_SECRET
    })

    const appId = config.PODIO_APP_ID
    const appToken = config.PODIO_APP_TOKEN

    await new Promise((resolve, reject) => {
        podio.authenticateWithApp(appId, appToken, (err) => {
            if (err) {
                console.error('Failed to authenticate with Podio:', err)
                reject(err)
            } else {
                console.log('Successfully authenticated with Podio')
                resolve()
            }
        })
    })


    const response = await podio.request('POST', `/item/app/${appId}/filter/`, {
        filters: {
           
        },
        limit: 100,
    })
    const items = response.items || []
    let item1 = items[0];
    console.log('Items', items.length);
    
    
    return items
        .map(item => {
            const fieldMap = {}
            item.fields.forEach(field => {
                fieldMap[field.label.toLowerCase().replace(/\s+/g, '_')] = field.values[0]?.value || null
            })

            const latRaw = stripHtml(fieldMap.latitude)
            const lngRaw = stripHtml(fieldMap.longitude)

            if (!latRaw || !lngRaw) return null 
            const lat = parseFloat(latRaw)
            const lng = parseFloat(lngRaw)

            if (isNaN(lat) || isNaN(lng)) return null 

            return {
                id: item.item_id,
                address: fieldMap.address?.formatted || fieldMap.address || 'Unknown',
                status: fieldMap.status,
                foreclosureDate: fieldMap.fcl_rec_date?.start || null,
                auctionDate: fieldMap.auction_date?.start || null,
                lat,
                lng
            }
        })
        .filter(Boolean)
})


function stripHtml(html) {
    if (typeof html === 'string') {
        return html.replace(/<\/?[^>]+(>|$)/g, '').trim()
    }
    return null
}