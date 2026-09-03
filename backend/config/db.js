import mongoose from "mongoose";

const connectDB = async () => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        tls: true,
        family: 4,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000
      });
      console.log("✅ MongoDB Connected");
      return;
    } catch (error) {
      console.error(`❌ MongoDB attempt ${attempt}/3 failed:`, error.message);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error("MongoDB could not be connected after 3 attempts");
};

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

export default connectDB;
