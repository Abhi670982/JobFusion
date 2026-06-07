const { MongoClient } = require('mongodb');
const uri = "mongodb://localhost:27017/jobfusion";
async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    console.log("Connected to DB:", db.databaseName);
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`- ${coll.name}: ${count} docs`);
      if (count > 0) {
        const sample = await db.collection(coll.name).findOne();
        console.log("Sample:", JSON.stringify(sample, null, 2));
      }
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
