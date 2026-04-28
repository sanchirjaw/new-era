import { MongoClient } from "mongodb"

// Fallback to local MongoDB if environment variable is not set
const defaultUri = "mongodb://localhost:27017/new-era-platform"
const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || defaultUri

// Validate the connection string format
if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
  console.error('Invalid MongoDB URI format. Expected "mongodb://" or "mongodb+srv://" but got:', uri)
  throw new Error('Invalid MongoDB connection string format. Please check your MONGODB_URI environment variable.')
}

if (!uri) {
  throw new Error('Missing environment variable: "MONGODB_URI" or "MONGODB_URL"')
}

const options = {
  // Add connection options for better reliability
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise
