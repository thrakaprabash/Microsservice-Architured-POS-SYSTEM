const mongoose = require('mongoose');

let retries = 5;

const connectDB = async () => {
  while (retries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[product-service] MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      retries -= 1;
      console.error(`[product-service] MongoDB connection error: ${err.message}`);
      if (retries === 0) {
        console.error('[product-service] All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
      console.log(`[product-service] Retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
};

module.exports = connectDB;
