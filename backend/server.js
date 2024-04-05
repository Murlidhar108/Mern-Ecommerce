const app = require('./app')
const dotenv = require('dotenv')
const connectDatabase = require("./config/database")

// handling uncaught exception
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log('Shutting down the server due to Uncaught exception ');

    process.exit(1);
})

// config
dotenv.config({path: "backend/config/config.env"});

// connect to database
connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`server is working on port ${process.env.PORT}`);
})

// unhandled promise rejection
process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
    console;log('Shutting down the server due to Unhandled Promise Rejection');

    server.close(() => {
        process.exit(1);
    })
})