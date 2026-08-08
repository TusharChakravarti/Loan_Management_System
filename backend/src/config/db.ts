import mongoose from 'mongoose';
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
export const connectDB = async (): Promise<typeof mongoose> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loan_management_db';

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`[Database Critical Error] Failed to connect to MongoDB: ${(error as Error).message}`);
    // Fail clearly as required
    throw new Error(`Database connection failure: ${(error as Error).message}`);
  }
};
