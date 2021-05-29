const mongoose = require('mongoose');
require('dotenv').config();

const dbUrl = process.env.DB_URL || process.env.DB_DEV_URL;

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
