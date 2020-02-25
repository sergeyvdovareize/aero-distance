const fetch = require('node-fetch')
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const DATA_DIR = path.resolve(__dirname, 'data')
const DATA_FILE = `${DATA_DIR}/${process.env.AERO_OPEN_DATA_FILE}`
const CSV_HEADERS = [
    'id',
    'name',
    'city',
    'country',
    'iata',
    'icao',
    'lat',
    'long',
    'altitude',
    'timezone',
    'dst',
    'tzdata',
    'type',
    'source'
]

const cache = {}

exports.getData = async (orig, dest) => {
    if (!fs.existsSync(DATA_FILE)) {
        await this.refreshAeroData()
    }

    return new Promise((resolve, reject) => {
        let origData = cache[orig]
        let destData = cache[dest]

        if (origData && destData) {
            resolve({origData, destData})
        }
        
        fs.createReadStream(DATA_FILE)
            .pipe(csv(CSV_HEADERS))
            .on('data', row => {
                if (row.iata) {
                    if (row.iata.toUpperCase() === orig.toUpperCase()) {
                        origData = row
                        cache[orig] = row
                    }
                    else if (row.iata.toUpperCase() === dest.toUpperCase()) {
                        destData = row
                        cache[dest] = row
                    }
                }
            })
            .on('end', () => {
                let message
                if (!origData) {
                    if (!destData) {
                        message = 'could not find origin and destination airports'
                    } else {
                        message = 'could not find origin airport'
                    }
                } else if (!destData) {
                    message = 'could not find destination airport'
                } else {
                    resolve({origData, destData})
                }

                reject(message)
            })
            
    })
}

exports.refreshAeroData = () => {
    if (!fs.existsSync(DATA_DIR)){
        fs.mkdirSync(DATA_DIR);
    }

    return fetch(process.env.AERO_OPEN_DATA_URI)
        .then(res => {
            const stream = fs.createWriteStream(DATA_FILE);
            res.body.pipe(stream);
        });
}

exports.getTimetable = () => {
    return fetch(process.env.TIMETABLE_DATA_URI)
        .then(res => res.json())
}
