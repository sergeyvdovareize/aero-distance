module.exports = (app) => {
    const controller = require('./main.controller.js')
    app.get('/flights', controller.index)
    app.get('/distance', controller.distance)
    // app.get('/preferredFlight', controller.preferredFlight)
}
