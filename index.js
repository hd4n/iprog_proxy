const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

const SOLAR_API_BASE_URL = 'https://api.forecast.solar';
const CO2_BASE_URL = process.env.CO2_BASE_URL;

const CALL_LIMIT_PER_HOUR = 50;

let solarCallCount = 0;
let co2CallCount = 0;

setInterval(() => {
    solarCallCount = 0;
    co2CallCount = 0;
}, 60 * 60 * 1000);

app.get('/',(res,req)=>{
    res.send('Proxy running');
})


app.get('/solarapi/:lat/:long/:azimuth/:declination/:kpw1', async (req, res) => {
    if (solarCallCount >= CALL_LIMIT_PER_HOUR) {
        res.status(429).json({ error: "API rate limit exceeded." })
        return;
    }
    const apiKey = process.env.SOLAR_API_KEY;

    try {
        const response = await axios({
            method: "GET",
            url: `${SOLAR_API_BASE_URL}/${apiKey}/estimate/watthours/period/${req.params.lat}/${req.params.long}/${req.params.azimuth}/${req.params.declination}/${req.params.kpw1}`,
            headers: {
                "Accept": "application/json",
            },
        });

        solarCallCount++;
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.response.data });
    }
});

app.get('/co2api', async (req, res) => {
    if (co2CallCount >= CALL_LIMIT_PER_HOUR) {
        res.status(429).json({ error: "API rate limit exceeded." })
        return;
    }

    const params = `?start=${req.query.start}&end=${req.query.end}&consumption=${req.query.consumption}`;
    const apiKey = process.env.CO2_API_KEY;

    try {
        const response = await axios({
            method: "GET",
            url: `${CO2_BASE_URL}${params}`,
            headers: {
                "Content-Type": "application/json",
                Authorization: apiKey,
                Accept: "application/json",
            }
        })

        co2CallCount++;
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.response.data });
    }
})

app.listen(port);

module.exports = app;