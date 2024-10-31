import "dotenv/config";
import { dataBase } from "./db/database.js";
import { app } from "./app.js";
dataBase()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `Citrawarta is listeinig on port ${process.env.PORT || 8000}`
      );
    });
  })
  .catch((error) => {
    console.error(error);
  });
