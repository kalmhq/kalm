const Express = require("express");
const proxy = require("express-http-proxy");
const cors = require("cors");
const app = Express();

app.use("/", cors(), proxy("localhost:8001"));

const port = 3001;
app.listen(port, () => console.log(`app listening on port ${port}!`));
