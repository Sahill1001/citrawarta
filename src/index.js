import express from "express";
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("Hello Citrawārtā"));

app.listen(port, () => console.log(`Citrawārtā is listening on port ${port}`));
