import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const cloudinaryService = {
  async uploadFile(file: File, folder: string = 'new-era-platform'): Promise<string> {
    try {
      // Convert File to base64
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64String = buffer.toString('base64')
      const dataURI = `data:${file.type};base64,${base64String}`
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const filename = `${folder}/${timestamp}_${randomString}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataURI,
          {
            public_id: filename,
            resource_type: 'auto',
            folder: folder,
            overwrite: false,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
      })
      
      return (result as any).secure_url
    } catch (error) {
      // Fallback to local storage if Cloudinary fails
      return await this.uploadToLocalStorage(file, folder)
    }
  },

  async uploadToLocalStorage(file: File, folder: string = 'uploads'): Promise<string> {
    // This is a fallback method - in production you'd want to implement
    // proper local file storage or use a different cloud service
    throw new Error('Local storage not implemented - Cloudinary upload failed')
  }
}
