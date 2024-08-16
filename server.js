import express from "express";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";

const app = express();

if (process.env.NODE_ENV === "production") {
  ViteExpress.config({ mode: "production" });
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/server", async (req, res) => {
  if (!req.headers["x-triplehost"] || !req.headers["x-triplepath"]) {
    return res.sendStatus(400);
  }

  try {
    const response = await fetch(
      `${req.headers["x-triplehost"]}${req.headers["x-triplepath"]}`,
      {
        method: req.method,
        headers: {
          Authorization: req.headers.authorization,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        ...(req.method === "POST" && {
          body: `query=${encodeURIComponent(req.body.query)}`,
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

ViteExpress.listen(app, 5174, () => console.log("Server is listening..."));
