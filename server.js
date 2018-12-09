'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Env Variables

const PORT = process.env.PORT || 3000;

require('dotenv').config();

// Application

const app = express();

app.use(cors());

// Get API Data

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/yelp', getYelp);

// handlers

function getLocation(request, response){
  return searchToLatLong(request.query.data) // 'Lynnwood, WA'
    .then(locationData => {
      response.send(locationData);
    })
}

function getWeather (req, res){
  return searchForWeather(req.query.data)
    .then(weatherData => {
      res.send(weatherData);
    })
}

function getYelp(req, res){
  return searchForYelp(req.query.data)
    .then(searchForYelpData => {
      res.send(searchForYelpData);
    })
}
// Constructors

function Location(location){
  this.formatted_query = location.formatted_address;
  this.latitude = location.geometry.location.lat;
  this.longitude = location.geometry.location.lng;
}

function Daily(dayForecast){
  this.forecast = dayForecast.summary;
  this.time = new Date(dayForecast.time * 1000).toDateString();
}

function Yelp(business) {
  this.name = business.name;
  this.image_url = business.image_url;
  this.price = business.price;
  this.rating = business.rating;
  this.url = business.url;
}

// Search for Resource

function searchToLatLong(query){
  const mapUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.Google_Maps_API}`;
  return superagent.get(mapUrl)
    .then(geoData => {
      const location = new Location(geoData.body.results[0]);
      return location;
    })
    .catch(err => console.error(err));
}

function searchForWeather(query){
  // console.log(query)
  const weatherUrl = `https://api.darksky.net/forecast/${process.env.Dark_Sky_API}/${query.latitude},${query.longitude}`;
  return superagent.get(weatherUrl)
    .then(weatherData => {
      let dailyWeatherArray = weatherData.body.daily.data.map(forecast => new Daily(forecast));
      // console.log(dailyWeatherArray)
      return dailyWeatherArray;
    })
    .catch(err => console.error(err));
}

function searchForYelp(query){
  const yelpUrl = `https://api.yelp.com/v3/businesses/search?term=restaurants&latitude=${query.latitude}&longitude=${query.longitude}`;
  return superagent.get(yelpUrl)
    .set('Authorization', `Bearer ${process.env.Yelp_ApI}`)
    .then(searchForYelpData => {
      console.log(searchForYelpData, 'heyyyyyyyyy')
      return searchForYelpData.body.businesses.map(business => new Yelp(business))
    })
    .catch(err => console.error(err));
}

// Error messages
app.get('/*', function(req, res){
  res.status(404).send('you are in the wrong place');
})

app.listen(PORT, () => {
  console.log(`app is running on port: ${PORT}`);
})
