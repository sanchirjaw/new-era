# Vercel Large File Upload Solution

## 🚨 Critical Issue: Vercel File Size Limits

Since you're using **Vercel**, there's a fundamental limitation that cannot be bypassed:

### Vercel Plan Limits
- **Hobby Plan**: 4.5MB max request body size
- **Pro Plan**: 6MB max request body size  
- **Enterprise Plan**: 50MB max request body size

**Your 680MB file is 151x larger than even the Enterprise plan limit!**

## 🎯 Recommended Solution: Direct Upload to Bunny.net

Instead of uploading through Vercel, implement **direct uploads to Bunny.net** from the client:

### 1. Update Your Upload API

```typescript
// app/api/admin/upload/video/route.ts
export async function POST(request: NextRequest) {
  try {
    // Instead of handling file upload, generate upload URL
    const { filename, fileSize, contentType } = await request.json()
    
    // Generate pre-signed URL for Bunny.net
    const uploadUrl = await bunnyVideoService.getPresignedUploadUrl({
      filename,
      fileSize,
      contentType
    })
    
    return NextResponse.json({ 
      success: true,
      uploadUrl,
      message: "Upload directly to Bunny.net using the provided URL"
    })
  } catch (error) {
    console.error("Failed to generate upload URL:", error)
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 })
  }
}
```

### 2. Update Bunny.net Service

```typescript
// lib/bunny-video.ts
export class BunnyVideoService {
  // ... existing methods ...
  
  async getPresignedUploadUrl({ filename, fileSize, contentType }: {
    filename: string
    fileSize: number
    contentType: string
  }) {
    try {
      // Create video entry first
      const video = await this.createVideo({
        title: filename,
        description: `Uploaded via direct upload`,
        tags: [],
        category: "education"
      })
      
      if (!video.success || !video.videoId) {
        throw new Error("Failed to create video entry")
      }
      
      // Generate upload URL
      const uploadUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos/${video.videoId}`
      
      return {
        success: true,
        uploadUrl,
        videoId: video.videoId,
        headers: {
          'AccessKey': this.apiKey,
          'Content-Type': contentType
        }
      }
    } catch (error) {
      console.error("Failed to generate upload URL:", error)
      return { success: false, error: error.message }
    }
  }
}
```

### 3. Update Frontend Upload Logic

```typescript
// components/upload-form.tsx or similar
const handleFileUpload = async (file: File) => {
  try {
    // Step 1: Get upload URL from your API
    const response = await fetch('/api/admin/upload/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        fileSize: file.size,
        contentType: file.type
      })
    })
    
    const { uploadUrl, headers } = await response.json()
    
    // Step 2: Upload directly to Bunny.net
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: headers,
      body: file
    })
    
    if (uploadResponse.ok) {
      console.log('✅ File uploaded successfully to Bunny.net')
      // Handle success
    } else {
      throw new Error('Upload failed')
    }
  } catch (error) {
    console.error('❌ Upload failed:', error)
    // Handle error
  }
}
```

## 🔧 Alternative Solutions

### Solution 2: Chunked Uploads (Complex)

Split large files into chunks smaller than Vercel's limit:

```typescript
const chunkSize = 4 * 1024 * 1024 // 4MB chunks
const chunks = Math.ceil(file.size / chunkSize)

for (let i = 0; i < chunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize)
  await uploadChunk(chunk, i, chunks)
}
```

**Pros**: Works with Vercel limits
**Cons**: Complex implementation, potential for upload failures

### Solution 3: Upgrade Vercel Plan

- **Pro Plan**: $20/month, 6MB files, 60s execution
- **Enterprise Plan**: Custom pricing, 50MB files, 15min execution

**Note**: Even Enterprise plan won't handle your 680MB files!

## 📋 Implementation Steps

### Phase 1: Immediate Fix (Recommended)
1. ✅ **Deploy the code changes** we made
2. ✅ **Create `vercel.json`** configuration
3. 🔄 **Implement direct upload to Bunny.net**
4. 🧪 **Test with large files**

### Phase 2: Enhanced Features
1. **Add upload progress tracking**
2. **Implement retry logic**
3. **Add file validation**
4. **Create upload queue system**

## 🧪 Testing the Solution

### 1. Test Direct Upload
```bash
# Test the new API endpoint
curl -X POST https://edunewera.mn/api/admin/upload/video \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mp4","fileSize":1048576,"contentType":"video/mp4"}'
```

### 2. Test File Upload to Bunny.net
Use the generated upload URL to test direct uploads.

### 3. Monitor Upload Performance
Check upload speeds and success rates.

## 🚀 Benefits of Direct Upload

1. **No Vercel Limits**: Upload files of any size
2. **Better Performance**: Direct connection to Bunny.net
3. **Reduced Server Load**: Vercel functions don't handle large files
4. **Scalability**: Handle multiple large uploads simultaneously
5. **Cost Effective**: No need to upgrade Vercel plan

## ⚠️ Considerations

### Security
- Validate file types and sizes on the client
- Implement proper authentication for upload URLs
- Monitor for abuse

### Error Handling
- Implement retry logic for failed uploads
- Handle network interruptions gracefully
- Provide user feedback during uploads

### Monitoring
- Track upload success rates
- Monitor upload speeds
- Alert on failed uploads

## 🔍 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Bunny.net allows your domain
2. **Authentication Failures**: Check API keys and permissions
3. **Upload Timeouts**: Implement progress tracking and resumable uploads
4. **File Size Validation**: Validate on client before attempting upload

### Debug Steps

1. Check browser network tab for upload requests
2. Verify Bunny.net API responses
3. Check Vercel function logs
4. Test with smaller files first

## 📞 Support

If you need help implementing this solution:

1. **Check Bunny.net documentation** for direct upload APIs
2. **Review Vercel documentation** for function limits
3. **Test with smaller files** to verify the flow
4. **Monitor upload performance** and adjust as needed

---

**Status**: 🎯 **SOLUTION IDENTIFIED** - Direct upload to Bunny.net
**Priority**: **CRITICAL** - Current approach won't work with Vercel
**Next Action**: Implement direct upload to Bunny.net
**Timeline**: 1-2 days for basic implementation
