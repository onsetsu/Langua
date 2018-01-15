const sqlite = require("sqlite3");
const db = new sqlite.Database("imported.sqlite3");

function getQuery(q) {
	return new Promise(function(resolve, reject) {
		db.all(q, (err, data) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(data);
		});
	})
}

const q = `select city, population
from "cities"
where population > 3300300
order by population
limit 50`

getQuery(q).then(_ => console.log(_))