import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const options = {
  // Explicitly specify the database name
  dbName: process.env.MONGODB_DB || 'NAVI',
  // SSL/TLS configuration
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  // Connection settings
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority' as const,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;