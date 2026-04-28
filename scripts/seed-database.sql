-- MongoDB equivalent operations for seeding data
-- This file documents the initial data structure

-- Sample courses data
db.courses.insertMany([
  {
    title: "AI Course",
    description: "Machine Learning & Deep Learning",
    price: 69000,
    originalPrice: 210000,
    category: "business",
    level: "beginner",
    duration: 1200,
    videoUrl: "/placeholder.svg?height=400&width=600",
    thumbnailUrl: "/placeholder.svg?height=300&width=400",
    lessons: [
      {
        title: "Introduction to AI",
        description: "Basic concepts and overview",
        videoUrl: "/placeholder.svg?height=400&width=600",
        duration: 60,
        order: 1,
        isPreview: true
      },
      {
        title: "Machine Learning Fundamentals",
        description: "Core ML concepts and algorithms",
        videoUrl: "/placeholder.svg?height=400&width=600",
        duration: 90,
        order: 2,
        isPreview: false
      }
    ],
    enrolledCount: 20,
    rating: 4.5,
    totalRatings: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "TEST",
    description: "test",
    price: 50,
    originalPrice: null,
    category: "business",
    level: "beginner",
    duration: 20,
    videoUrl: "/placeholder.svg?height=400&width=600",
    thumbnailUrl: "/placeholder.svg?height=300&width=400",
    lessons: [],
    enrolledCount: 2,
    rating: 4.5,
    totalRatings: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

-- Sample admin user
db.users.insertOne({
  name: "Admin",
  email: "admin@newera.mn",
  password: "$2b$10$hashedpassword", // This should be properly hashed
  role: "admin",
  enrolledCourses: [],
  createdAt: new Date(),
  updatedAt: new Date()
});
