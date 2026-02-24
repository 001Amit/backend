import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Host:", conn.connection.host);
    console.log("MongoDB Database Name:", conn.connection.name);
    console.log("Mongo URI:", process.env.MONGO_URI);
  } catch (error) {
    console.error("MongoDB error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
