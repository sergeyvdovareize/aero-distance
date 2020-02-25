const calculator = require('./calculator')
const aeroDataProcessor = require('./aero-data-processor')

exports.index = (req, res) => {
    res.send('hello aero')
}

exports.distance = async ({ query: {orig, dest} }, res) => {
    aeroDataProcessor.getData(orig, dest)
        .then(({ origData, destData }) => {
            const unit = 'km'
            const distance = Math.round(calculator.calc(origData.lat, origData.long, destData.lat, destData.long, unit))
            const result = {
                originPoint: {
                    airport: origData.iata,
                    name: origData.name,
                    city: origData.city,
                    country: origData.country
                },
                destinationPoint: {
                    airport: destData.iata,
                    name: destData.name,
                    city: destData.city,
                    country: destData.country
                },
                distance,
                unit
            }

            res.send(result)
        })
        .catch(error => {
            res.status(404).send(error)
        })
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
