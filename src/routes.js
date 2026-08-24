"use strict";

const { mountAuth } = require("./routes-auth");
const { mountParents } = require("./routes-parents");
const { mountRun } = require("./routes-run");

function mountRoutes(app) {
  mountAuth(app);
  mountParents(app);
  mountRun(app);
}

module.exports = { mountRoutes };
