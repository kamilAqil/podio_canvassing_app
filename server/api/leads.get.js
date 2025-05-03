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
        filters: {},
        limit: 100
    })

    const items = response.items || []
    let item1 = items[0];
    console.log('Item 1 fields', item1.fields);
    
    
    return items.map(item => {
        const fieldMap = {}
        
        
        item.fields.forEach(field => {
            fieldMap[field.label.toLowerCase().replace(/\s+/g, '_')] = field.values[0]?.value || null
        })

        console.log('Field Map', fieldMap);
        console.log('~~~~~~~~~~~');
        
        
        return {
            id: item.item_id,
            address: fieldMap.address?.formatted || fieldMap.address || 'Unknown',
            status: fieldMap.status,
            foreclosureDate: fieldMap.foreclosure_date?.start || null,
            auctionDate: fieldMap.auction_date?.start || null,
            lat: fieldMap.address?.lat || null,
            lng: fieldMap.address?.lng || null
        }
    })
})
