import { connect } from "mongoose";
import { DB_URI } from "../config/config";

const connectDB = async () => {
  if (!DB_URI) {
    throw new Error(
      "DB_URI is not defined. Please set DB_URI in your environment file.",
    );
  }

  try {
    await connect(DB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log("DB Connected Successfully 😉");
  } catch (error) {
    console.error("DB Connection Failed 😒", error);
    throw error;
  }
};
export default connectDB;
