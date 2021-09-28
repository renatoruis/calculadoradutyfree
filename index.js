require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch');
const redis = require('redis');
const responseTime = require('response-time');
const PORT = process.env.PORT || 5000;

const client = redis.createClient(process.env.REDIS_ENDPOINT_URI, {
  // password: process.env.REDIS_PASSWORD,
});
const api_key = process.env.API_KEY

const app = express();
app.set("view engine", "ejs");
app.use(express.static('public'))
//
// const query = "AED_BRL"

// Set response
function composeResponse(rate, amount, codeMoney) {
  rate = Number.parseFloat(rate).toFixed(3);
  sumAmountConverted = amount * rate
  sumCardFee = (sumAmountConverted / 100) * 4
  sumIOFBrasil = ((sumAmountConverted + sumCardFee) / 100) * 6.38
  sumAmountTotal = sumAmountConverted + sumCardFee + sumIOFBrasil

  AmountConverted = Number.parseFloat(sumAmountConverted).toFixed(2);
  CardFee = Number.parseFloat(sumCardFee).toFixed(2);
  IOFBrasil = Number.parseFloat(sumIOFBrasil).toFixed(2);
  AmountTotal = Number.parseFloat(sumAmountTotal).toFixed(2);
  // return Number.parseFloat(IOFBrasil).toFixed(2);
  resultado = true
  result = {
    resultado,
    rate,
    AmountConverted,
    CardFee,
    IOFBrasil,
    AmountTotal,
    amount,
    codeMoney,
  }
  console.log(result)
  return result
}

async function fetchApiJson(code) {
  let url = `https://free.currconv.com/api/v7/convert?apiKey=${API_KEY}&q=${code}&compact=ultra`;
  let settings = { method: "Get" };
  const response = await fetch(url, settings);
  const rates = await response.json();
  return rates;
}

function cacheMiddleware(req, res) {
  const codeMoney = req.query.codeMoney;
  const amount = req.query.amount;
  const code = `${codeMoney}_BRL`
  client.get(code, (err, data) => {
    if (err) throw err;
    if (data !== null) {
      console.log("cache encontrado!", data)
      const result = composeResponse(data, amount, codeMoney)
      res.render("index", {
        result
      });
    } else {
      console.log("cache não encontrado!")
      fetchApiJson(code).then(results => {
        const data = results[code]
        client.setex(code, 86400, data);
        const result = composeResponse(data, amount, codeMoney)
        res.render("index", {
          result
        });

      });
    }
  })
}


app.use(responseTime());
app.get("/", (req, res) => {
  res.render("index", {
    resultado: "",
  });
 });

app.get('/rate', cacheMiddleware);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app
