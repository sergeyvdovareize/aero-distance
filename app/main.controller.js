const calculator = require('./calculator')
const aeroDataProcessor = require('./aero-data-processor')

exports.index = (req, res) => {
    res.send('hello aero')
}

exports.distance = async ({ query: {orig, dest} }, res) => {
    try {
        const unit = 'km'
        const { origData, destData } = await aeroDataProcessor.getData(orig, dest)
        
        const url = prepareDistanceUrl(origData, destData)
        console.log('aws url - ', url)
        
        let distance = await fetch(url)
        console.log(distance)
        
        distance = Math.round(distance)
        const result = {
            originPoint: preparePointResponse(origData),
            destinationPoint: preparePointResponse(destData),
            distance,
            unit
        }

        res.send(result)
    } catch(error) {
        res.status(404).send(error)
    }
}

exports.preferredFlight = async ({ query }, res) => {
    const criteria = {
        carriers: query.carriers.split(',').map(carrier => carrier.toUpperCase()),
        minDate: (new Date(query.minDate)).setHours(0,0,0,0),
        maxDate: (new Date(query.maxDate)).setHours(23,59,59,999),
        minDuration: query.minDuration,
        maxDuration: query.maxDuration,
        maxDistance: parseInt(query.maxDistance, 10),
    }

    const schedule = await aeroDataProcessor.getTimetable()
    const filteredSchedule = await schedule.filter(flight => flightFilter(flight, criteria))
    // const filteredSchedule = schedule.map(flight => flightFilter(flight, criteria))
    res.send(filteredSchedule)
}

function prepareDistanceUrl(origData, destData) {
    const params = {
        lat1: origData.lat,
        lat2: destData.lat,
        lon1: origData.long,
        lon2: destData.long,
    }
    const queryParams = Object.keys(params).map(key => key + '=' + params[key]).join('&');
    return `${process.env.AERO_DISTANCE_LAMBDA_FUNCTION_URL}?${queryParams}`
}

function preparePointResponse(pointData) {
    return {
        airport: pointData.iata,
        name: pointData.name,
        city: pointData.city,
        country: pointData.country
    }
}

function flightFilter(flight, criteria) {
    const departureTime = new Date(flight.departureTime)
    const arrivalTime = new Date(flight.arrivalTime)
    
    const isPreferred = (criteria.carriers.indexOf(flight.carrier.toUpperCase()) !== -1) &&
        criteria.minDate <= departureTime &&
        criteria.maxDate >= arrivalTime
    
    return isPreferred

    // if (!isPreferred) {
    //     return false
    // }

    // const { origData, destData } = await aeroDataProcessor.getData(flight.origin, flight.destination)
    // const distance = Math.round(calculator.calc(origData.lat, origData.long, destData.lat, destData.long))
    // // console.log(distance, distance <= criteria.maxDistance)
    //     // .then(({ origData, destData }) => {
    //     //     const unit = 'km'
    //     //     // console.log(distance)
    //     // })

    // return isPreferred && distance <= criteria.maxDistance
}
