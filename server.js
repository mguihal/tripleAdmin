import express from "express";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import process from 'node:process';

process.on('SIGINT', () => {
  console.info("Interrupted");
  process.exit(0);
});

const app = express();

if (process.env.NODE_ENV === "production") {
  ViteExpress.config({ mode: "production" });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/env.js', async (req, res) => {
  const vars = ['TRIPLEADMIN_HOST', 'TRIPLEADMIN_USERNAME']
  return res.send(vars.map(key => `window.${key} = "${process.env[key] || ''}"`).join(';'));
});

app.use('/api/server', async (req, res) => {
  if (!req.headers["x-triplehost"] || !req.headers["x-triplepath"]) {
    return res.sendStatus(400);
  }

  try {
    const body = new URLSearchParams(req.body);

    const response = await fetch(
      `${req.headers["x-triplehost"]}${req.headers["x-triplepath"]}`,
      {
        method: req.method,
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: req.headers.accept || undefined,
        },
        ...(req.method === "POST" && {
          body: body.toString(),
        }),
      }
    );

    if (response.status === 400) {
      const errorContent = await response.text();
      console.log('Error 400', errorContent);
    }

    if (!response.ok) {
      return res.sendStatus(response.status);
    }

    const content = await response.text();
    return res.send(content);
  } catch (e) {
    return res.sendStatus(500);
  }
});

app.use('/api/lastVersion', async (req, res) => {
  try {
    const response = await fetch('https://github.com/mguihal/tripleAdmin/releases/latest');

    if (response.ok) {
      const urlParts = response.url.split('/tag/');
      if (urlParts.length === 2) {
        return res.send(urlParts[1]);
      }
    }
    return res.sendStatus(500);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

ViteExpress.listen(app, 3033, () => console.log("Server is listening..."));
