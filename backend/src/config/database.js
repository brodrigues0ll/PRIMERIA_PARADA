const mongoose = require("mongoose");

async function connectDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado.");
}

module.exports = { connectDatabase };
