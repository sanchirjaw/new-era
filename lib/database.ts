import clientPromise from "./mongodb"
import type { User } from "./models/User"
import type { Course } from "./models/Course"
import type { Enrollment } from "./models/Enrollment"
import type { Payment } from "./models/Payment"
import { ObjectId } from "mongodb"

export async function connectDB() {
  const client = await clientPromise
  return client.db("new-era-platform")
}

export class Database {
  private static instance: Database
  private client: any

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  private async getClient() {
    if (!this.client) {
      this.client = await clientPromise
    }
    return this.client
  }

  // User operations
  async createUser(user: Omit<User, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    // Ensure enrolledCourses is an array of ObjectIds
    const userData = {
      ...user,
      enrolledCourses: Array.isArray(user.enrolledCourses) 
        ? user.enrolledCourses 
        : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection("users").insertOne(userData)
    return result.insertedId
  }

  async getAllUsers(): Promise<User[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("users").find({}).toArray()
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("users").findOne({ email })
  }

  async getUserById(id: ObjectId): Promise<User | null> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("users").findOne({ _id: id })
  }

  async updateUser(userId: ObjectId, updates: Partial<User>): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    console.log("Database updateUser called with:", { userId: userId.toString(), updates })
    console.log("Phone field in updates:", { phone: updates.phone, phoneType: typeof updates.phone, phoneLength: updates.phone?.length })
    
    const result = await db.collection("users").updateOne(
      { _id: userId },
      { $set: { ...updates, updatedAt: new Date() } }
    )
    
    console.log("Database update result:", { modifiedCount: result.modifiedCount, matchedCount: result.matchedCount })
    
    return result.modifiedCount > 0
  }

  async deleteUser(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("users").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  // Course operations
  async createCourse(course: Omit<Course, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("courses").insertOne({
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return result.insertedId
  }

  async getAllCourses(): Promise<Course[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("courses").find({ isActive: true }).toArray()
  }

  async getCourseById(id: ObjectId): Promise<Course | null> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("courses").findOne({ _id: id })
  }

  async getCourseWithLessons(id: ObjectId): Promise<Course | null> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    const course = await db.collection("courses").findOne({ _id: id })
    if (!course) return null
    
    // Get sub-courses for this course
    const subCourses = await db.collection("subCourses")
      .find({ courseId: id, isActive: true })
      .sort({ order: 1 })
      .toArray()
    
    // Get all lessons for all sub-courses
    const allLessons = []
    for (const subCourse of subCourses) {
      const lessons = await db.collection("lessons")
        .find({ subCourseId: subCourse._id })
        .sort({ order: 1 })
        .toArray()
      
      allLessons.push(...lessons.map((lesson: any) => ({
        _id: lesson._id?.toString(),
        title: lesson.title,
        description: lesson.description,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        order: lesson.order,
        isPreview: lesson.isPreview,
        subCourseId: lesson.subCourseId?.toString()
      })))
    }
    
    return {
      ...course,
      lessons: allLessons,
      subCourses: subCourses.map((subCourse: any) => ({
        _id: subCourse._id?.toString(),
        title: subCourse.title,
        description: subCourse.description,
        order: subCourse.order,
        isActive: subCourse.isActive
      }))
    }
  }

  async updateCourse(id: ObjectId, updates: Partial<Course>): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db
      .collection("courses")
      .updateOne({ _id: id }, { $set: { ...updates, updatedAt: new Date() } })
    return result.modifiedCount > 0
  }

  async deleteCourse(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("courses").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  // Enrollment operations
  async createEnrollment(enrollment: Omit<Enrollment, "_id">): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("enrollments").insertOne(enrollment)
    return result.insertedId
  }

  async getUserEnrollments(userId: ObjectId): Promise<Enrollment[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("enrollments").find({ userId, isActive: true }).toArray()
  }

  async deleteEnrollment(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("enrollments").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  async getCourseEnrollmentCount(courseId: ObjectId): Promise<number> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("enrollments").countDocuments({ 
      courseId, 
      isActive: true 
    })
  }

  // Payment operations
  async createPayment(payment: Omit<Payment, "_id" | "createdAt" | "updatedAt">): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("payments").insertOne({
      ...payment,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return result.insertedId
  }

  async getAllPaymentsWithDetails(): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    const payments = await db.collection("payments")
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course"
          }
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$course",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            courseId: 1,
            amount: 1,
            currency: 1,
            status: 1,
            paymentMethod: 1,
            qpayInvoiceId: 1,
            qpayTransactionId: 1,
            createdAt: 1,
            user: {
              name: "$user.name",
              email: "$user.email"
            },
            course: {
              title: "$course.title"
            }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]).toArray()
    
    return payments
  }

  async updatePaymentStatus(id: ObjectId, status: Payment["status"], transactionId?: string, transactionType?: "qpay" | "byl"): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const updates: any = { status, updatedAt: new Date() }
    
    if (transactionId && transactionType === "qpay") {
      updates.qpayTransactionId = transactionId
    } else if (transactionId && transactionType === "byl") {
      // For Byl, we don't want to overwrite the existing bylCheckoutId or bylInvoiceId
      // Just update the status and timestamp
    }
    
    const result = await db.collection("payments").updateOne({ _id: id }, { $set: updates })
    return result.modifiedCount > 0
  }

  async updatePaymentBylCheckoutId(id: ObjectId, bylCheckoutId: number): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("payments").updateOne(
      { _id: id }, 
      { $set: { bylCheckoutId, updatedAt: new Date() } }
    )
    return result.modifiedCount > 0
  }

  async deletePayment(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("payments").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  async getUserPayments(userId: ObjectId): Promise<Payment[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("payments").find({ userId }).toArray()
  }

  // Statistics
  async getStats() {
    const client = await this.getClient()
    const db = client.db("new-era-platform")

    const [userCount, courseCount, enrollmentCount, totalRevenue] = await Promise.all([
      db.collection("users").countDocuments({ role: "student" }),
      db.collection("courses").countDocuments({ isActive: true }),
      db.collection("enrollments").countDocuments({ isActive: true }),
      db
        .collection("payments")
        .aggregate([{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
        .toArray(),
    ])

    return {
      userCount,
      courseCount,
      enrollmentCount,
      totalRevenue: totalRevenue[0]?.total || 0,
    }
  }

  // Platform Settings
  async getPlatformSettings() {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    const settings = await db.collection("platform_settings").findOne({})
    
    if (!settings) {
      // Return default settings if none exist
      return {
        siteName: "New Era Platform",
        siteDescription: "Online Learning Platform",
        siteUrl: "http://localhost:3000",
        contactEmail: "contact@newera.com",
        supportEmail: "support@newera.com",
        defaultCurrency: "MNT",
        timezone: "Asia/Ulaanbaatar",
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: false,
        maxFileSize: 0, // 0 means no file size limit
        allowedFileTypes: ["mp4", "avi", "mov", "wmv", "flv", "webm"],
        googleAnalyticsId: "",
        facebookPixelId: "",
        stripePublicKey: "",
        stripeSecretKey: "",
        qpayMerchantId: "",
        qpayApiKey: "",
        bunnyApiKey: "",
        bunnyVideoLibraryId: ""
      }
    }
    
    return settings
  }

  async updatePlatformSettings(settings: any) {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      // Filter out _id field to prevent MongoDB immutable field error
      const { _id, ...settingsWithoutId } = settings
      const cleanSettings = { ...settingsWithoutId, updatedAt: new Date() }
      
      const result = await db.collection("platform_settings").updateOne(
        {}, // Update the first (and only) document
        { $set: cleanSettings },
        { upsert: true } // Create if doesn't exist
      )
      
      return result.modifiedCount > 0 || result.upsertedCount > 0
    } catch (error) {
      console.error("Database error in updatePlatformSettings:", error)
      throw error
    }
  }

  // Sub-Course operations
  async createSubCourse(subCourse: any): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    // Convert courseId to ObjectId if it's a string
    const courseId = typeof subCourse.courseId === 'string' ? new ObjectId(subCourse.courseId) : subCourse.courseId
    
    const result = await db.collection("sub_courses").insertOne({
      ...subCourse,
      courseId, // Use converted ObjectId
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return result.insertedId
  }

  async getAllSubCourses(): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("sub_courses").find({}).toArray()
  }

  async getSubCoursesByCourseId(courseId: ObjectId): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("sub_courses").find({ courseId: courseId }).toArray()
  }

  async getSubCourseById(id: ObjectId): Promise<any | null> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("sub_courses").findOne({ _id: id })
  }

  async updateSubCourse(id: ObjectId, updates: any): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db
      .collection("sub_courses")
      .updateOne({ _id: id }, { $set: { ...updates, updatedAt: new Date() } })
    return result.modifiedCount > 0
  }

  async deleteSubCourse(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("sub_courses").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  // Lesson operations
  async createLesson(lesson: any): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("lessons").insertOne({
      ...lesson,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return result.insertedId
  }

  async getAllLessons(): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("lessons").find({}).toArray()
  }

  async updateLesson(id: ObjectId, updates: any): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db
      .collection("lessons")
      .updateOne({ _id: id }, { $set: { ...updates, updatedAt: new Date() } })
    return result.modifiedCount > 0
  }

  async deleteLesson(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("lessons").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  // Media Grid Layout operations
  async getMediaGridLayout(): Promise<any> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    const layout = await db.collection("media_grid_layouts").findOne({})
    
    if (!layout) {
      // Create a more appealing default layout
      const defaultCells = []
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 6; x++) {
          defaultCells.push({ x, y })
        }
      }
      
      // Add some sample media placements to make it look more interesting
      const sampleLayout = {
        id: "default",
        name: "Main Grid",
        width: 6,
        height: 4,
        cells: defaultCells,
        isPublished: true,
        isLive: false,
        lastSaved: new Date().toISOString()
      }
      
      // Save the default layout
      await this.updateMediaGridLayout(sampleLayout)
      
      return sampleLayout
    }
    

    
    return layout
  }

  async updateMediaGridLayout(layout: any): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    const result = await db.collection("media_grid_layouts").updateOne(
      {}, // Update the first (and only) document
      { $set: { ...layout, updatedAt: new Date() } },
      { upsert: true } // Create if doesn't exist
    )
    
    return result.modifiedCount > 0 || result.upsertedCount > 0
  }

  // Media operations
  async getAllMediaItems(): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const mediaItems = await db.collection("media_items").find({}).toArray()
    
    return mediaItems
  }

  async createMediaItem(mediaItem: any): Promise<ObjectId> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("media_items").insertOne({
      ...mediaItem,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    return result.insertedId
  }

  async updateMediaItem(id: ObjectId, updates: any): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db
      .collection("media_items")
      .updateOne({ _id: id }, { $set: { ...updates, updatedAt: new Date() } })
    return result.modifiedCount > 0
  }

  async deleteMediaItem(id: ObjectId): Promise<boolean> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    const result = await db.collection("media_items").deleteOne({ _id: id })
    return result.deletedCount > 0
  }

  // Database Statistics
  async getDatabaseStats() {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    
    try {
      // Get database stats
      const dbStats = await db.stats()
      
      // Get collections info
      const collections = await db.listCollections().toArray()
      const collectionsInfo = await Promise.all(
        collections.map(async (collection: any) => {
          const coll = db.collection(collection.name)
          const stats = await coll.stats()
          const lastDoc = await coll.findOne({}, { sort: { _id: -1 } })
          
          return {
            name: collection.name,
            size: stats.size || 0,
            documents: stats.count || 0,
            lastUpdated: lastDoc?.updatedAt || lastDoc?.createdAt || new Date().toISOString(),
            status: "Active"
          }
        })
      )
      
      const stats = {
        collections: collections.length,
        totalSize: dbStats.dataSize || 0,
        totalDocuments: dbStats.objects || 0,
        storageUsed: dbStats.storageSize || 0,
        storageTotal: (dbStats.storageSize || 0) * 2 // Approximate total storage
      }
      
      return { stats, collections: collectionsInfo }
    } catch (error) {

      // Return default values if stats fail
      return {
        stats: {
          collections: 0,
          totalSize: 0,
          totalDocuments: 0,
          storageUsed: 0,
          storageTotal: 0
        },
        collections: []
      }
    }
  }

  // Video management methods
  async saveVideoMetadata(videoData: {
    uploadId: string
    bunnyVideoId: string
    videoUrl: string
    title: string
    description: string
    filename: string
    fileSize: number
    fileType: string
    uploadedBy: string
    uploadedAt: Date
    status: string
  }): Promise<string> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      const result = await db.collection("videos").insertOne({
        ...videoData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      return result.insertedId.toString()
    } catch (error) {

      throw error
    }
  }

  async getVideoById(videoId: string): Promise<any> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      return await db.collection("videos").findOne({ _id: new ObjectId(videoId) })
    } catch (error) {

      throw error
    }
  }

  async updateVideoStatus(videoId: string, status: string, metadata?: any): Promise<boolean> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      }
      
      if (metadata) {
        updateData.metadata = metadata
      }
      
      const result = await db.collection("videos").updateOne(
        { _id: new ObjectId(videoId) },
        { $set: updateData }
      )
      
      return result.modifiedCount > 0
    } catch (error) {

      throw error
    }
  }

  async getLessonsBySubCourseId(subCourseId: ObjectId): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    return await db.collection("lessons").find({ subCourseId: subCourseId }).toArray()
  }

  async getLessonsByCourseId(courseId: ObjectId): Promise<any[]> {
    const client = await this.getClient()
    const db = client.db("new-era-platform")
    // Get all sub-courses for this course first
    const subCourses = await db.collection("subcourses").find({ courseId: courseId }).toArray()
    const subCourseIds = subCourses.map((sc: any) => sc._id)
    
    // Find lessons that belong to any of these sub-courses
    return await db.collection("lessons").find({ 
      subCourseId: { $in: subCourseIds } 
    }).toArray()
  }

  // Recent Activities for Admin Dashboard
  async getRecentActivities() {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      // Get recent activities from different collections
      const [recentUsers, recentCourses, recentPayments, recentEnrollments] = await Promise.all([
        // Recent users (last 5)
        db.collection("users")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        
        // Recent courses (last 5)
        db.collection("courses")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        
        // Recent payments (last 5)
        db.collection("payments")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray(),
        
        // Recent enrollments (last 5)
        db.collection("enrollments")
          .find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray()
      ])
      
      // Define activity interface
      interface Activity {
        id: string
        type: string
        action: string
        title: string
        description: string
        timestamp: Date
        status: string
        icon: string
      }
      
      // Combine and format activities
      const activities: Activity[] = []
      
      // Add user activities
      recentUsers.forEach((user: any) => {
        activities.push({
          id: user._id?.toString(),
          type: 'user',
          action: 'registered',
          title: user.name || user.email || 'New User',
          description: `New user ${user.role || 'student'} registered`,
          timestamp: user.createdAt || new Date(),
          status: 'success',
          icon: '👤'
        })
      })
      
      // Add course activities
      recentCourses.forEach((course: any) => {
        activities.push({
          id: course._id?.toString(),
          type: 'course',
          action: 'created',
          title: course.title || 'New Course',
          description: `New course "${course.title}" created`,
          timestamp: course.createdAt || new Date(),
          status: 'success',
          icon: '📚'
        })
      })
      
      // Add payment activities
      recentPayments.forEach((payment: any) => {
        activities.push({
          id: payment._id?.toString(),
          type: 'payment',
          action: payment.status || 'completed',
          title: `Payment ${payment.status || 'completed'}`,
          description: `Payment of ₮${payment.amount || 0} ${payment.status || 'completed'}`,
          timestamp: payment.createdAt || new Date(),
          status: payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'error',
          icon: '💰'
        })
      })
      
      // Add enrollment activities
      recentEnrollments.forEach((enrollment: any) => {
        activities.push({
          id: enrollment._id?.toString(),
          type: 'enrollment',
          action: 'enrolled',
          title: 'New Enrollment',
          description: `Student enrolled in course`,
          timestamp: enrollment.createdAt || new Date(),
          status: 'success',
          icon: '🎓'
        })
      })
      
      // Sort all activities by timestamp (most recent first) and return top 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        
    } catch (error) {
      console.error("Error fetching recent activities:", error)
      return []
    }
  }

  // Progress tracking functions
  async markLessonComplete(userId: ObjectId, courseId: ObjectId, lessonId: ObjectId): Promise<boolean> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      // Check if progress record exists
      const existingProgress = await db.collection("userProgress").findOne({
        userId,
        courseId,
        lessonId
      })

      if (existingProgress) {
        // Update existing progress
        const result = await db.collection("userProgress").updateOne(
          { _id: existingProgress._id },
          { 
            $set: { 
              isCompleted: true,
              completedAt: new Date(),
              updatedAt: new Date()
            }
          }
        )
        return result.modifiedCount > 0
      } else {
        // Create new progress record
        const result = await db.collection("userProgress").insertOne({
          userId,
          courseId,
          lessonId,
          completedAt: new Date(),
          isCompleted: true,
          progress: 100,
          timeSpent: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        return result.insertedId !== undefined
      }
    } catch (error) {
      console.error("Failed to mark lesson complete:", error)
      return false
    }
  }

  async getUserProgress(userId: ObjectId, courseId: ObjectId): Promise<any> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      // Get all completed lessons for this user and course
      const completedLessons = await db.collection("userProgress")
        .find({ userId, courseId, isCompleted: true })
        .toArray()
      
      // Get course with lessons using the proper method
      const course = await this.getCourseWithLessons(courseId)
      let totalLessons = 0
      
      // Count total lessons from subcourses
      if (course && 'subCourses' in course && course.subCourses) {
        totalLessons = (course as any).subCourses.reduce((total: number, subCourse: any) => {
          return total + (subCourse.lessons?.length || 0)
        }, 0)
      }
      
      // Fallback to direct lessons if no subcourses
      if (totalLessons === 0 && course && 'lessons' in course && course.lessons) {
        totalLessons = (course as any).lessons.length
      }
      
      console.log(`Progress calculation for course ${courseId}:`, {
        completedLessons: completedLessons.length,
        totalLessons,
        courseHasSubCourses: !!(course && 'subCourses' in course && course.subCourses),
        courseHasLessons: !!(course && 'lessons' in course && course.lessons)
      })
      
      // Calculate progress percentage
      const progress = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0
      
      return {
        completedLessons: completedLessons.map((p: any) => p.lessonId),
        totalLessons,
        progress
      }
    } catch (error) {
      console.error("Failed to get user progress:", error)
      return {
        completedLessons: [],
        totalLessons: 0,
        progress: 0
      }
    }
  }

  async getCompletedLessons(userId: ObjectId): Promise<ObjectId[]> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      const completedLessons = await db.collection("userProgress")
        .find({ userId, isCompleted: true })
        .project({ lessonId: 1 })
        .toArray()
      
      return completedLessons.map((p: any) => p.lessonId)
    } catch (error) {
      console.error("Failed to get completed lessons:", error)
      return []
    }
  }

  async addCourseToUser(userId: ObjectId, courseId: ObjectId): Promise<boolean> {
    try {
      const client = await this.getClient()
      const db = client.db("new-era-platform")
      
      const result = await db.collection("users").updateOne(
        { _id: userId },
        { $push: { enrolledCourses: courseId } }
      )
      
      return result.modifiedCount > 0
    } catch (error) {
      console.error("Failed to add course to user:", error)
      return false
    }
  }
}

export const db = Database.getInstance()
