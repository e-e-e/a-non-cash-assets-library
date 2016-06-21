# Arts Asset Platform (working title)

*Need to include some text about the project here.*

## Setup for development

```sh
# install gulp globally for dev
sudo npm i gulp -g

# install node dependancies and run task
npm install
gulp

# run server
node index.js

# or run server with gulp to automatically lint, 
# precompile and relaunch server on changes
gulp run

```

Requires config.json:

```js
{
	"port":8080,
	"cookies": {
		"secret": "ExampleCookie",
		"resave": false,
		"saveUninitialized": true
	},
	"postgres": {
		"connectionString":"postgres://admin:admin@localhost:5432/noncash"
	}
}
```

Requires postgreSQL database running locally. On Mac OSX you can use [PostgresApp](http://postgresapp.com).

Opening `database.sql` within psql should correctly set up the database: `\i \path\to\database.sql`


