const mongoose = require('mongoose');

const connectDB = async () => {
  const maxRetries = 5;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      attempt++;
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
