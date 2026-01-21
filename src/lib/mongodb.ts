import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    }).catch(err => {
      console.error('MongoDB connection error:', err);
      cached.promise = null; // Reset promise on error
      throw err;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // If the promise was rejected, it will be caught here.
    // The promise has already been cleared in the catch block above.
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
