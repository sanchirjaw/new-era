# Production File Size Upload Fix - 413 Content Too Large Error

## Problem Summary

You're experiencing a **413 (Content Too Large)** error when trying to upload large video files (680MB) in production. This error is coming from the server level, not from your Next.js application.

## Error Details

```
POST https://edunewera.mn/api/admin/upload/video 413 (Content Too Large)
Background upload failed: SyntaxError: Unexpected token 'R', "Request En"... is not valid JSON
```

## Root Cause

The 413 error is typically caused by **server-level file size limits** set by:

1. **Web Server** (nginx, Apache, etc.)
2. **Hosting Provider** (Vercel, Netlify, custom server)
3. **Load Balancer** or **CDN**
4. **Server Configuration** (PHP limits, Node.js limits)

## What We've Fixed in Your Code

### 1. Next.js Configuration (`next.config.mjs`)
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: false, // Disable body size limit
  },
},
```

### 2. API Route Configuration
Added to both upload routes:
```javascript
export const config = {
  api: {
    bodyParser: false, // Disable body parser for large files
    responseLimit: false, // Disable response size limit
  },
}
```

### 3. Enhanced Error Handling
Better error messages and file size logging for debugging.

## Server-Level Fixes Required

### Option 1: If Using nginx

Add to your nginx configuration:
```nginx
http {
    client_max_body_size 2G;  # Allow files up to 2GB
    client_body_timeout 300s;  # Increase timeout for large uploads
    client_header_timeout 300s;
    
    # For your specific domain
    server {
        server_name edunewera.mn;
        client_max_body_size 2G;
        client_body_timeout 300s;
        
        location /api/admin/upload/ {
            client_max_body_size 2G;
            client_body_timeout 300s;
        }
    }
}
```

### Option 2: If Using Apache

Add to your `.htaccess` file or Apache configuration:
```apache
# Increase file upload limits
LimitRequestBody 2147483648  # 2GB in bytes
php_value upload_max_filesize 2G
php_value post_max_size 2G
php_value max_execution_time 300
php_value max_input_time 300
php_value memory_limit 2G
```

### Option 3: If Using Vercel ⭐ **YOUR CURRENT SETUP**

**Important**: Vercel has **hard limits** that cannot be bypassed:

- **Maximum request body size**: 4.5MB (Hobby plan), 6MB (Pro plan), 50MB (Enterprise plan)
- **Maximum function execution time**: 10 seconds (Hobby), 60 seconds (Pro), 900 seconds (Enterprise)
- **Maximum function memory**: 1024MB (Hobby), 3008MB (Pro), 3008MB (Enterprise)

**For your 680MB file, you need to implement a different approach:**

#### Solution 1: Direct Upload to Bunny.net (Recommended)
```javascript
// Instead of uploading to Vercel, upload directly to Bunny.net
const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
// Client uploads directly to Bunny.net, then your API just handles metadata
```

#### Solution 2: Chunked Uploads
```javascript
// Split large files into chunks smaller than Vercel's limit
const chunkSize = 4 * 1024 * 1024; // 4MB chunks (under Vercel's limit)
const chunks = Math.ceil(file.size / chunkSize);

for (let i = 0; i < chunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
  await uploadChunk(chunk, i, chunks);
}
```

#### Solution 3: Upgrade Vercel Plan
- **Pro Plan**: Allows up to 6MB files and 60-second execution
- **Enterprise Plan**: Allows up to 50MB files and 15-minute execution

**Created `vercel.json` configuration:**
```json
{
  "functions": {
    "app/api/admin/upload/**/*.ts": {
      "maxDuration": 300
    }
  },
  "headers": [
    {
      "source": "/api/admin/upload/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

### Option 4: If Using Custom Node.js Server

If you're running your own Node.js server, update your server configuration:
```javascript
// For Express.js
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ limit: '2gb', extended: true }));

// For raw Node.js
const server = http.createServer((req, res) => {
  // Handle large uploads
  req.setTimeout(300000); // 5 minutes
});
```

## Environment Variables to Check

Make sure these are set in your production environment:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Increase timeout for large uploads
NEXT_TIMEOUT=300000
```

## Testing the Fix

### 1. Test with a Large File
Try uploading a video file larger than 100MB to see if the 413 error is resolved.

### 2. Check Server Logs
Look for any remaining file size errors in your server logs.

### 3. Monitor Upload Progress
Large files should now upload without the 413 error.

## Alternative Solutions

### 1. Chunked Uploads
If server limits persist, implement chunked file uploads:
```javascript
// Split large files into chunks
const chunkSize = 10 * 1024 * 1024; // 10MB chunks
const chunks = Math.ceil(file.size / chunkSize);

for (let i = 0; i < chunks; i++) {
  const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
  await uploadChunk(chunk, i, chunks);
}
```

### 2. Direct to Bunny.net
Upload directly to Bunny.net from the client:
```javascript
// Use Bunny.net's direct upload API
const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos`;
// Upload directly to Bunny.net
```

### 3. Pre-signed URLs
Generate pre-signed URLs for direct uploads:
```javascript
// Generate pre-signed URL for Bunny.net
const presignedUrl = await bunnyVideoService.getPresignedUploadUrl(filename, fileSize);
// Client uploads directly to Bunny.net
```

## Monitoring and Debugging

### 1. Check File Size Limits
```bash
# Test with curl
curl -X POST https://edunewera.mn/api/admin/upload/video \
  -H "Content-Type: multipart/form-data" \
  -F "videoFile=@large-video.mp4" \
  -F "title=Test" \
  -F "description=Test"
```

### 2. Server Response Headers
Check if your server is sending any size-related headers:
```bash
curl -I https://edunewera.mn/api/admin/upload/video
```

### 3. Browser Network Tab
Monitor the actual request size and response in browser dev tools.

## Common Issues and Solutions

### Issue: Still Getting 413 Error
**Solution**: The limit is set at the hosting provider level. Contact your hosting provider to increase file size limits.

### Issue: Upload Times Out
**Solution**: Increase timeout values in your server configuration.

### Issue: Memory Errors
**Solution**: Increase Node.js memory limits and implement streaming uploads.

### Issue: CDN Blocking Large Files
**Solution**: Configure your CDN to allow large file uploads or bypass CDN for upload endpoints.

## Next Steps

1. **Apply the server configuration changes** based on your hosting setup
2. **Restart your server** after making configuration changes
3. **Test with a large file** to verify the fix
4. **Monitor upload performance** and adjust timeouts if needed
5. **Consider implementing chunked uploads** for very large files (>1GB)

## Support

If you continue to experience issues:

1. Check your hosting provider's documentation for file size limits
2. Contact your hosting provider's support team
3. Check server logs for detailed error information
4. Consider upgrading your hosting plan if limits are too restrictive

---

**Status**: 🔧 **IN PROGRESS** - Code changes applied, server configuration needed
**Last Updated**: Current date
**Next Action**: Update server configuration based on your hosting setup
