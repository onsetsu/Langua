// Boilerplate

const fetch = require("node-fetch");
const R = require("ramda");
const {without, concat, uniq, map, sortBy, filter, sum, pluck} = R;
const sqlite = require("sqlite3");

const db = new sqlite.Database("./sample-app/cities.sqlite3");

const mockRequests = true;

function sql(q) {
	return new Promise(function(resolve, reject) {
		db.all(q, (err, data) => {
			err ? reject(err) : resolve(data);
		});
	});
}

// Slides a window of size 2 over an array and returns a new array containing the results
// of func being called for each window
const slidingWindow = func => arr => {
	var result = [];
    for (var i = 0; i < arr.length - 1; i++) {
        result.push(func(arr[i], arr[i+1]));
    }
    return result;
};

// Helper functions

// Fetches GPS data for a city from an API.
// We have to consider the case, in which the API does not now the city
// and that the API might not have GPS information about the city.
async function fetchLocation(city) {
	// or:
	// const key = "AIzaSyA-dQK97ACR6QkUrtlsv7-8yACxqnIMHrc";
	const key = "AIzaSyCeJ3Zt6FKUs_8XLX1__waBOa8VoKQ9yKI";
	const placesUrl = "https://maps.googleapis.com/maps/api/place/autocomplete/json?types=(cities)&key=" + key;
	const geoUrl = "https://maps.googleapis.com/maps/api/place/details/json?key=" + key;
	
	if (mockRequests) {
		const gps = {lat: 2341324 * Math.random(), lng: 234321421 * Math.random()}
		return {city, gps}
	}

	const cities = await fetch(placesUrl + "&input=" + city).then(_ => _.json());
	const placeid = cities.predictions[0]?.place_id;
	let gps;
	if (placeid) {
		const data = await fetch(geoUrl + "&placeid=" + placeid).then(_ => _.json());
		gps = data?.result?.geometry?.location;
	}

	return {city, gps};
}

// Computes distance between two gps coordinates
function distFn(gps1, gps2) {
	var lat1 = gps1.lat;
	var lng1 = gps1.lng;
	var lat2 = gps2.lat;
	var lng2 = gps2.lng;
	var radlat1 = Math.PI * lat1/180
	var radlat2 = Math.PI * lat2/180
	var theta = lng1-lng2
	var radtheta = Math.PI * theta/180
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist)
	dist = dist * 180/Math.PI
	dist = dist * 60 * 1.1515;
	return dist
}

// Main code
async function calculateRoute() {
	// Build itinerary

	const sortingCriteria = "population";
	const limit = 50;
	const cityNames = await sql {
		select city from cities
		where population > 3000000
		order by ${sortingCriteria}
		limit ${limit}
	}

	const alreadyVisitedCities = ["Berlin, Germany", "London, Great Britain (UK)", "Paris, France"];
	const mustSeeCities = ["Bucharest, Romania", "Valencia, Spain"];
	const route = await cityNames
		|>  pluck('city')
		|>  without(alreadyVisitedCities)
		|>  concat(mustSeeCities)
		|>  uniq
		|>  map(fetchLocation)
		|>  Promise.all
		|>> filter(c => c.gps)    // Drop cities without gps
		|>> sortBy(el => el.name);

	const rawDistance = route
		|> map(city => city.gps)
		|> slidingWindow(distFn)
		|> sum;
	// const route = [{city: "Berlin"}];
	// const rawDistance = 2000;

	// Rough estimation of distance, time and fuel needed for the trip

	const distance = rawDistance * 1mile + 5000km+-5000km;
	const fuelConsumption = (7l/100km) +- (3l/100km);
	const avgSpeed = 60km/h +- 10km/h;
	const fuelPrice = 1.052$/l +- 0.1$/l;

	const time = distance / avgSpeed;
	const fuel = fuelConsumption * distance;
	const cost = fuelPrice * fuel;

	console.log("Visit the following cities:", route.map(el => el.city));
	console.log("Estimated distance", distance.format("km"));
	console.log("Estimated time", time.format("d"));
	console.log("Estimated fuel", fuel.format("l"));
	console.log("Estimated cost", cost.format("dollar"));
}


calculateRoute();