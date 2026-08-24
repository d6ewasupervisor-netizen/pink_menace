"use strict";

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { migrate, query } = require("./src/db");
const { appKind } = require("./src/host");
const { mountRoutes } = require("./src/routes");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "pink-menace", kind: appKind(req) });
});

app.use("/shared", express.static(path.join(__dirname, "public", "shared"), { maxAge: "1h" }));

mountRoutes(app);

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found." });
});

app.use((req, res, next) => {
  const dir = appKind(req) === "parents" ? "parents" : "game";
  express.static(path.join(__dirname, "public", dir), { index: false, maxAge: "1h" })(req, res, next);
});

app.get("*", (req, res) => {
  const dir = appKind(req) === "parents" ? "parents" : "game";
  res.sendFile(path.join(__dirname, "public", dir, "index.html"));
});

const port = Number(process.env.PORT || 8080);

migrate()
  .then(() => {
    setInterval(() => {
      query(`DELETE FROM pending_links WHERE created_at < now() - interval '30 days'`).catch(() => {});
    }, 6 * 60 * 60 * 1000);
    app.listen(port, "0.0.0.0", () => {
      console.log(`pink-menace listening on ${port}`);
    });
  })
  .catch((err) => {
    console.error("migrate failed", err);
    process.exit(1);
  });
