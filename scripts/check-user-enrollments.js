const { MongoClient, ObjectId } = require('mongodb')

async function checkUserEnrollments() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
  const client = new MongoClient(uri)
  
  try {
    await client.connect()
    console.log('Connected to MongoDB')
    
    const db = client.db('new-era-platform')
    
    // Check users collection
    const users = await db.collection('users').find({}).toArray()
    console.log(`Found ${users.length} users`)
    
    // Check enrollments collection
    const enrollments = await db.collection('enrollments').find({ isActive: true }).toArray()
    console.log(`Found ${enrollments.length} active enrollments`)
    
    // Check which users are missing enrolledCourses field
    const usersWithoutEnrolledCourses = users.filter(user => !user.enrolledCourses)
    console.log(`Users without enrolledCourses field: ${usersWithoutEnrolledCourses.length}`)
    
    if (usersWithoutEnrolledCourses.length > 0) {
      console.log('Users missing enrolledCourses:')
      usersWithoutEnrolledCourses.forEach(user => {
        console.log(`- ${user.name || user.email} (${user._id})`)
      })
    }
    
    // Check if enrollments match user.enrolledCourses
    for (const user of users) {
      if (user.enrolledCourses && user.enrolledCourses.length > 0) {
        console.log(`User ${user.name || user.email} has ${user.enrolledCourses.length} enrolled courses`)
      }
    }
    
    // Show enrollment details
    for (const enrollment of enrollments) {
      const user = await db.collection('users').findOne({ _id: enrollment.userId })
      const course = await db.collection('courses').findOne({ _id: enrollment.courseId })
      
      console.log(`Enrollment: User ${user?.name || user?.email} enrolled in ${course?.title || 'Unknown Course'}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

checkUserEnrollments()
