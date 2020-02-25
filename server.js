const dotenv = require('dotenv')
const express = require('express')
const { urlencoded, json } = require('body-parser')

dotenv.config()
const app = express()
app.use(urlencoded({ extended: true }))
app.use(json())


require('./app/routes.js')(app)

app.listen(process.env.PORT, () => {
    console.log(`Aero server is listening on port ${process.env.PORT}`)
})
