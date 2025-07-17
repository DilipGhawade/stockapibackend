import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info("MongoDB Connected....");

    // verify connection
    mongoose.connection.on("connected", () => {
      logger.info("Mongoose connected to DB");
    });
    mongoose.connection.on("error", (error) => {
      logger.error(`Mongoose connection error: ${error.message}`);
    });
  } catch (error) {
    logger.error(`Mongoose connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
