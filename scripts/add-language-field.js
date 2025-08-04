const { MongoClient } = require('mongodb')

async function addLanguageField() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/localcart')
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db()
    const users = db.collection('users')
    
    // Add language field to all users who don't have it
    const result = await users.updateMany(
      { language: { $exists: false } },
      { $set: { language: 'en' } }
    )
    
    console.log(`Updated ${result.modifiedCount} users with default language 'en'`)
    
    // Verify the update
    const totalUsers = await users.countDocuments()
    const usersWithLanguage = await users.countDocuments({ language: { $exists: true } })
    
    console.log(`Total users: ${totalUsers}`)
    console.log(`Users with language field: ${usersWithLanguage}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
    console.log('Database connection closed')
  }
}

addLanguageField()