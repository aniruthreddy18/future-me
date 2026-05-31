const serverless = require("serverless-http");
const app = require("../server.js");

// Wrap Express app as a serverless Netlify handler
module.exports.handler = serverless(app);
