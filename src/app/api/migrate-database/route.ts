import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        { error: 'MongoDB URI not found' },
        { status: 500 }
      );
    }

    const client = new MongoClient(uri);
    await client.connect();

    // Connect to both databases
    const testDb = client.db('test');
    const naviDb = client.db('NAVI');

    // Get collections from test database
    const testCollections = await testDb.listCollections().toArray();
    const userCollections = testCollections.filter(col => 
      col.name === 'users' || col.name === 'User'
    );

    let migratedUsers = 0;
    let migratedCollections = [];

    // Migrate user data from test to NAVI
    for (const collection of userCollections) {
      const testCollection = testDb.collection(collection.name);
      const naviUsersCollection = naviDb.collection('users');
      
      // Get all documents from test collection
      const documents = await testCollection.find({}).toArray();
      
      if (documents.length > 0) {
        // Insert documents into NAVI database (users collection)
        const result = await naviUsersCollection.insertMany(documents);
        migratedUsers += result.insertedCount;
        migratedCollections.push(collection.name);
      }
    }

    // List all collections in test database for deletion
    const allTestCollections = await testDb.listCollections().toArray();
    let deletedCollections = [];

    // Drop collections from test database
    for (const collection of allTestCollections) {
      await testDb.collection(collection.name).drop();
      deletedCollections.push(collection.name);
    }

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      migratedUsers,
      migratedCollections,
      deletedCollections,
      targetDatabase: 'NAVI',
      targetCollection: 'users'
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check current database status
export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        { error: 'MongoDB URI not found' },
        { status: 500 }
      );
    }

    const client = new MongoClient(uri);
    await client.connect();

    // Check test database
    const testDb = client.db('test');
    const testCollections = await testDb.listCollections().toArray();
    
    // Check NAVI database
    const naviDb = client.db('NAVI');
    const naviCollections = await naviDb.listCollections().toArray();
    
    // Count users in each database
    let testUserCount = 0;
    let naviUserCount = 0;

    try {
      const testUsersCollection = testDb.collection('users');
      testUserCount = await testUsersCollection.countDocuments();
    } catch (e) {
      // Collection might not exist
    }

    try {
      const naviUsersCollection = naviDb.collection('users');
      naviUserCount = await naviUsersCollection.countDocuments();
    } catch (e) {
      // Collection might not exist
    }

    await client.close();

    return NextResponse.json({
      currentConfig: {
        targetDatabase: process.env.MONGODB_DB || 'NAVI'
      },
      testDatabase: {
        collections: testCollections.map(c => c.name),
        userCount: testUserCount
      },
      naviDatabase: {
        collections: naviCollections.map(c => c.name),
        userCount: naviUserCount
      }
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}