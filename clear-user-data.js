// Script to clear conflicting user data
// Run this with: node clear-user-data.js

const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/codered-astra');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear user data
const clearUserData = async () => {
  try {
    await connectDB();
    
    // Delete all users with the specific email
    const result = await mongoose.connection.db.collection('users').deleteMany({
      email: 'seeiouslyman23@gmail.com'
    });
    
    console.log(`✅ Deleted ${result.deletedCount} user records`);
    
    // Also clear NextAuth sessions and accounts
    await mongoose.connection.db.collection('sessions').deleteMany({});
    await mongoose.connection.db.collection('accounts').deleteMany({});
    await mongoose.connection.db.collection('users').deleteMany({});
    
    console.log('✅ Cleared all NextAuth data');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

clearUserData();
