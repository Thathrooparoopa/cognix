const mongoose = require("mongoose");

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn("?? MONGODB_URI is not configured.");
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`?? MongoDB Connected: ${mongoose.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`?? MongoDB connection warning: ${error.message}`);
    return false;
  }
};

module.exports = connectDatabase;
