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


## Setup for server

NGINX serving static content.

```nginx
upstream noncash {
	server 127.0.0.1:8080;
}

server {

	listen 80;
	server_name *.noncash.space;
	root /var/www/noncash/public;

	location / {
		try_files $uri @node;
	}

	location @node {
		proxy_set_header Host $http_host;
		proxy_set_header X-Forwarded-For $remote_addr;
		proxy_pass http://noncash;
	}
}
```

create symbolic link from www root to dir where platform is installed.
`ln -s /var/www/noncash/public /to/dir/where/this/is/installed/../public/dist/`

## To deploy

Currently deploying stupidly via SSH.

```sh
# cd to codebase
cd ~/a-non-cash-assets-library/

# if made changes to server code and added packages
git pull; npm i; gulp; pm2 restart index;
# if made changes to server code
git pull; gulp; pm2 restart index;
# if just changes to css or dust
git pull; gulp;
```

## Todo:

- Implement tests using Mocha and Chai
- refactor Dust templates into a better form - or replace with React.


