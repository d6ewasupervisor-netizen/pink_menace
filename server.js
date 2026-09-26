"use strict";

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const { migrate, query } = require("./src/db");
const { appKind, parentsUrl } = require("./src/host");
const { driveEnabled } = require("./src/routes-drive");
const auth = require("./src/auth");
const { mountRoutes } = require("./src/routes");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
// The drive's save document can exceed 64 kb (351 spaced-repetition rows); that one route parses its own body.
const json64 = express.json({ limit: "64kb" });
app.use((req, res, next) => (req.path === "/api/drive/progress" ? next() : json64(req, res, next)));
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "pink-menace", kind: appKind(req) });
});

app.use("/shared", express.static(path.join(__dirname, "public", "shared"), { maxAge: "7d" }));

mountRoutes(app);

// ── Single student surface. An authenticated student who hits the root is sent
// ── straight into the drive (the 3D scene). Parents and unauthenticated visitors
// ── stay on the login / parent shell, so there is no redirect loop: the drive
// ── bounces signed-out users back here to sign in.
app.get("/", async (req, res, next) => {
  if (appKind(req) !== "game" || !driveEnabled()) return next();
  try {
    const session = await auth.readSession(auth.getToken(req));
    if (session && session.role === "student") return res.redirect("/drive");
  } catch {
    /* No session is readable — fall through to the home shell. */
  }
  next();
});

// ── Quiet Roads, the 3D drive: a Vite build at public/game/drive, served under /drive. ──
// Hashed bundles get a year; index.html never caches. DRIVE_ENABLED gates the whole thing.
const driveDir = path.join(__dirname, "public", "game", "drive");
app.use("/drive/assets", (req, res, next) => {
  if (!driveEnabled()) return next();
  express.static(path.join(driveDir, "assets"), { maxAge: "1y", immutable: true })(req, res, next);
});
app.use("/drive", (req, res, next) => {
  if (!driveEnabled()) return next();
  express.static(driveDir, { index: false, maxAge: "7d" })(req, res, next); // models, audio, stills, quiet
});
app.get(["/drive", "/drive/*"], (req, res) => {
  if (!driveEnabled()) return res.redirect("/");
  if (appKind(req) === "parents") return res.redirect(parentsUrl());
  res.set("cache-control", "no-store");
  res.sendFile(path.join(driveDir, "index.html"));
});

app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found." });
});

app.use((req, res, next) => {
  const dir = appKind(req) === "parents" ? "parents" : "game";
  const maxAge = dir === "game" ? 0 : "1h";
  express.static(path.join(__dirname, "public", dir), { index: false, maxAge })(req, res, next);
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
