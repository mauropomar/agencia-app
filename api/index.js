'use strict'
const mongoose = require('mongoose');
const app = require('./app');

// Reading environment config
const CURRENT_ENVIRONMENT = process.env.NODE_ENV;
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const DB_URL = CURRENT_ENVIRONMENT === 'development' ? process.env.DB_LOCAL: process.env.DB_MONGODB_ATLAS

mongoose.Promise = global.Promise;

// Connection to DB
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Connection successful");
        app.listen(PORT, HOSTNAME, () => {
            console.log('Server is running port 3805')
        })
    })
    .catch(err => {
        console.error("Connection error")
        console.log(err)
    });