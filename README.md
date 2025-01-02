# TripleAdmin

A web interface for Triplestore databases.


Easily query, browse, insert, update or delete your data!

Databases supported:
- Apache Jena Fuseki

### How to use it?

- With Docker

```bash
docker run -p 3033:3033 mguihal/tripleadmin:latest

# If you want to access databases on localhost
docker run -p 3033:3033 --add-host localhost:host-gateway mguihal/tripleadmin:latest

# You can define TRIPLEADMIN_HOST environment variable to force the host
docker run -p 3033:3033 -e TRIPLEADMIN_HOST=http://fuseki:3030 mguihal/tripleadmin:latest

# You can define TRIPLEADMIN_USER environment variable to force the user
docker run -p 3033:3033 -e TRIPLEADMIN_USERNAME=admin mguihal/tripleadmin:latest
```

- With Docker compose

```yaml
services:
  tripleadmin:
    image: mguihal/tripleadmin:latest
    ports:
      - '3033:3033'
    extra_hosts:
      - 'localhost:host-gateway' # If you want to access databases on localhost
    environment:
      - TRIPLEADMIN_HOST=http://fuseki:3030/ # If you want to force the host
      - TRIPLEADMIN_USERNAME=admin # If you want to force the user
```

- Locally

```bash
npm install

# Run in production mode
npm run build
npm run serve

# Run in development mode
npm run dev
```

Then go to `http://localhost:3033` to access the app.
Host is the http url of Fuseki web interface (for example http://localhost:3030).

Enjoy 🎉
