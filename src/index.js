import "dotenv/config";

import express from "express";
import { dataBase } from "./db/database.js";

dataBase();
const app = express();

app.get("/", (req, res) => {
  res.send("Hello Citrawarta");
});
app.listen(process.env.PORT, () => {
  console.log(
    `The app is litening on port ${process.env.PORT} and this is the link http://127.0.0.1:8000/`
  );
});
