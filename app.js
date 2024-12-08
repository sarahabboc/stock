const fs = require('fs');
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = 3000;

// Connect to MongoDB
const uri = "mongodb+srv://sarahabbo:24Sarah26@cluster0.he5rw.mongodb.net/Stock";

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
        console.error("Error connecting to MongoDB:", err.message);
        process.exit(1);
    });

// Define schema and model
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    ticker: { type: String, required: true },
    price: { type: Number, required: true },
});

// Ensure the model uses the correct collection name
// If your collection is 'PublicCompanies', use this:
// If your collection is something else like 'companies' or 'publiccompanies', change the third parameter accordingly
const Company = mongoose.model('PublicCompanies', companySchema, 'PublicCompanies');

// Middleware for serving static files (e.g., HTML form)
app.use(express.static('public'));

// Home route (HTML form)
app.get('/', (req, res) => {
    res.send(`
        <form method="GET" action="/process">
            <label>
                <input type="radio" name="searchBy" value="name" required> Company Name
            </label>
            <label>
                <input type="radio" name="searchBy" value="ticker" required> Ticker Symbol
            </label>
            <br><br>
            <input type="text" name="search" placeholder="Enter name or ticker" required>
            <br><br>
            <button type="submit">Search</button>
        </form>
    `);
});

// Process route
app.get('/process', async (req, res) => {
    const { searchBy, search } = req.query;
    console.log("Received search request:", { searchBy, search }); // Debug message

    if (!searchBy || !search) {
        console.error("Missing search parameters."); // Debug message
        return res.status(400).send("Missing search parameters.");
    }

    try {
        let query;
        if (searchBy === 'name') {
            query = { name: { $regex: `^${search}$`, $options: 'i' } }; // Case-insensitive name search
        } else if (searchBy === 'ticker') {
            query = { ticker: { $regex: `^${search}$`, $options: 'i' } }; // Case-insensitive ticker search
        } else {
            console.error("Invalid searchBy parameter:", searchBy); // Debug message
            return res.status(400).send("Invalid searchBy parameter.");
        }

        console.log("Database query:", query); // Debug message
        const companies = await Company.find(query);

        if (companies.length === 0) {
            console.log("No companies found for query:", query); // Debug message
            return res.send("No companies found.");
        }

        // Display results in console
        console.log("Search results:", companies); // Debug message
        let resultHTML = "<h1>Search Results</h1><ul>";
        companies.forEach(company => {
            resultHTML += `
                <li>
                    <strong>${company.name}</strong> (${company.ticker}): $${company.price.toFixed(2)}
                </li>`;
        });
        resultHTML += "</ul>";

        // Add a "Back Home" button
        resultHTML += `
            <br>
            <a href="/" style="padding: 10px; background-color: lightgray; text-decoration: none; border-radius: 5px;">Back Home</a>
        `;

        res.send(resultHTML); // Display results on the webpage
    } catch (err) {
        console.error("Error during database query:", err.message); // Debug message
        res.status(500).send("An error occurred while processing your request.");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
