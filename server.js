const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

//db connect
async function main() {
  let client = new MongoClient(process.env.CONNECTIONSTRING, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  });

  try {
    // Connect to the MongoDB cluster
    await client.connect();
    // Make the appropriate DB calls
    exports.db = client.db();
    console.log("Connected to db.");
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
      console.log(`connected to port ${PORT}`);
    });
  } catch (e) {
    console.error(e);
  }
}
main().catch(console.error);

//middlewares
app.use(morgan("dev"));

//to be able to work with form data and json data
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(cors({ origin: true }));


//routes
app.use("/api", require("./router"));

module.exports = app;
