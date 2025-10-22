# S3 Bucket Configuration for Sync.so Integration

## Issue

Sync.so API returns error: **"Unable to retrieve audio metadata"** when trying to access files in your S3 bucket.

**Root Cause:** S3 bucket has "Block Public Access" settings enabled, preventing external services (like Sync.so) from accessing files even when ACL is set to `public-read`.

## Required S3 Bucket Settings

### 1. Disable Block Public Access

Go to AWS Console → S3 → Your Bucket (`taylorswiftnyu`) → Permissions → Block Public Access

**Turn OFF all four settings:**
- ✅ Block public access to buckets and objects granted through new access control lists (ACLs)
- ✅ Block public access to buckets and objects granted through any access control lists (ACLs)
- ✅ Block public access to buckets and objects granted through new public bucket or access point policies
- ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies

Click **"Save changes"** and confirm.

### 2. Verify Bucket Policy (Optional)

Your bucket policy should allow public read access for objects:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::taylorswiftnyu/*"
        }
    ]
}
```

### 3. Test Public Access

After changing settings, test that files are publicly accessible:

```bash
curl -I https://taylorswiftnyu.s3.amazonaws.com/users/USER_ID/jobs/JOB_ID/audio/AUDIO_FILE.mp3
```

**Expected result:** `HTTP/1.1 200 OK`

**If you see:** `HTTP/1.1 403 Forbidden` → Block Public Access is still enabled

## Why This Happened

Yesterday (Oct 19): Files were publicly accessible → Sync.so worked ✅

Today (Oct 20): Block Public Access was enabled → Sync.so cannot access files ❌

**Possible causes:**
- AWS automatically enabled Block Public Access as a security measure
- Someone manually changed bucket settings
- Bucket policy was modified

## Current Code Behavior

The backend already sets `ACL: 'public-read'` when uploading:

```python
self.s3_client.upload_file(
    local_file_path,
    self.bucket_name,
    s3_key,
    ExtraArgs={'ACL': 'public-read'}  # ✅ This is correct
)
```

But ACL is **ignored** if Block Public Access is enabled at the bucket level.

## Verification

After disabling Block Public Access, verify your uploads:

```bash
# Upload a new test file
# Then check if it's publicly accessible
curl -I https://taylorswiftnyu.s3.amazonaws.com/users/.../test.mp3

# Should return: HTTP/1.1 200 OK
```

## Alternative Solutions (Not Recommended)

1. **Presigned URLs** - Temporary authenticated URLs (we removed this per your request)
2. **CloudFront Distribution** - CDN with public access
3. **API Gateway Proxy** - Proxy S3 requests through your backend

We're using **public ACL** as requested, which is the simplest solution.

---

**Next Steps:**
1. Go to AWS S3 Console
2. Select `taylorswiftnyu` bucket
3. Go to **Permissions** tab
4. Edit **Block Public Access** settings
5. Turn OFF all 4 checkboxes
6. Save changes
7. Try submitting your video again

The issue will be resolved once Block Public Access is disabled.
