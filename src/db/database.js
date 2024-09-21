import { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

export const dataBase = async () => {
  try {
    const connectionInstance = await connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log("Connection Stablished !!", connectionInstance.connection.host);
  } catch (error) {
    console.error("Unable to connect to mongodb", error);
    process.exit(1);
  }
};
