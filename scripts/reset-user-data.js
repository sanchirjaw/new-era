/**
 * reset-user-data.js
 * Clears: users (non-admin), enrollments, payments, expenses, userProgress
 * Keeps:  admin user, courses, sub_courses, lessons, media
 */

const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

const MONGODB_URI =
  "mongodb+srv://sanchir:99958818Sad@newera.2kbugvg.mongodb.net/newera_prod?retryWrites=true&w=majority&appName=newEra"

const DB_NAME = "new-era-platform"

async function reset() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  const db = client.db(DB_NAME)

  console.log("Connected to:", DB_NAME)

  // 1. Count before
  const usersBefore     = await db.collection("users").countDocuments()
  const paymentsBefore  = await db.collection("payments").countDocuments()
  const enrollBefore    = await db.collection("enrollments").countDocuments()
  const expBefore       = await db.collection("expenses").countDocuments()
  const progressBefore  = await db.collection("userProgress").countDocuments()

  console.log("\n--- BEFORE ---")
  console.log(`Users:       ${usersBefore}`)
  console.log(`Payments:    ${paymentsBefore}`)
  console.log(`Enrollments: ${enrollBefore}`)
  console.log(`Expenses:    ${expBefore}`)
  console.log(`Progress:    ${progressBefore}`)

  // 2. Delete non-admin users
  const delUsers = await db.collection("users").deleteMany({ role: { $ne: "admin" } })
  console.log(`\nDeleted users (non-admin): ${delUsers.deletedCount}`)

  // 3. Clear payments
  const delPayments = await db.collection("payments").deleteMany({})
  console.log(`Deleted payments: ${delPayments.deletedCount}`)

  // 4. Clear enrollments
  const delEnroll = await db.collection("enrollments").deleteMany({})
  console.log(`Deleted enrollments: ${delEnroll.deletedCount}`)

  // 5. Clear expenses
  const delExp = await db.collection("expenses").deleteMany({})
  console.log(`Deleted expenses: ${delExp.deletedCount}`)

  // 6. Clear userProgress
  const delProgress = await db.collection("userProgress").deleteMany({})
  console.log(`Deleted userProgress: ${delProgress.deletedCount}`)

  // 7. Reset enrolledCount on all courses to 0
  const resetCourses = await db.collection("courses").updateMany({}, { $set: { enrolledCount: 0 } })
  console.log(`Reset enrolledCount on courses: ${resetCourses.modifiedCount}`)

  // 8. Ensure admin user exists
  const admin = await db.collection("users").findOne({ role: "admin" })
  if (!admin) {
    const hashed = await bcrypt.hash("admin123", 12)
    await db.collection("users").insertOne({
      name: "Admin",
      email: "admin@newera.mn",
      password: hashed,
      role: "admin",
      enrolledCourses: [],
      createdAt: new Date(),
    })
    console.log("\nAdmin user created: admin@newera.mn / admin123")
  } else {
    console.log(`\nAdmin user kept: ${admin.email}`)
  }

  // 9. Count after
  const usersAfter    = await db.collection("users").countDocuments()
  const paymentsAfter = await db.collection("payments").countDocuments()
  const enrollAfter   = await db.collection("enrollments").countDocuments()
  const expAfter      = await db.collection("expenses").countDocuments()

  console.log("\n--- AFTER ---")
  console.log(`Users:       ${usersAfter}`)
  console.log(`Payments:    ${paymentsAfter}`)
  console.log(`Enrollments: ${enrollAfter}`)
  console.log(`Expenses:    ${expAfter}`)

  // Check courses/lessons untouched
  const courses  = await db.collection("courses").countDocuments()
  const lessons  = await db.collection("lessons").countDocuments()
  console.log(`\nCourses (unchanged): ${courses}`)
  console.log(`Lessons (unchanged): ${lessons}`)

  await client.close()
  console.log("\nDone. Database reset complete.")
}

reset().catch(err => { console.error("Error:", err); process.exit(1) })
