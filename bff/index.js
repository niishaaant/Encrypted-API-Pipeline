const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const integrationServiceUrl = 'http://localhost:3002';

app.get('/public-key', async (req, res) => {
    try {
        const response = await axios.get(`${integrationServiceUrl}/public-key`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).send(error.response.data);
    }
});

app.post('/secure', async (req, res) => {
    try {
        const response = await axios.post(`${integrationServiceUrl}/secure`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).send(error.response.data);
    }
});

app.get('/secure', async (req, res) => {
    try {
        const response = await axios.get(`${integrationServiceUrl}/secure`, { params: req.query });
        res.json(response.data);
    } catch (error) {
        res.status(error.response.status).send(error.response.data);
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`BFF listening at http://localhost:${port}`);
});
