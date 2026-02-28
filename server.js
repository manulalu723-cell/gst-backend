require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./src/routes');
const db = require('./src/config/db'); // Initialize DB connection
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error("CORS not allowed for this origin: " + origin));
        }
    },
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api', routes);

// 404 Handler - MUST BE BEFORE ERROR HANDLER
app.use(notFound);

// Global Error Handler - MUST BE LAST
app.use(errorHandler);

const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
