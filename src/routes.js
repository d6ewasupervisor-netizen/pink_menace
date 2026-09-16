"use strict";

const { mountAuth } = require("./routes-auth");
const { mountParents } = require("./routes-parents");
const { mountRun } = require("./routes-run");
const { mountDrive } = require("./routes-drive");

function mountRoutes(app) {
  mountAuth(app);
  mountParents(app);
  mountRun(app);
  mountDrive(app);
}

module.exports = { mountRoutes };
