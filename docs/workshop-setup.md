# Workshop Setup Guide

## Overview

This guide helps you prepare the application for a workshop with ~30 concurrent users.

## Potential Issues & Solutions

### 1. Shared IP Address Problem ⚠️

**Issue**: If all participants are on the same WiFi network, they share the same public IP address. The rate limiter currently allows 10 requests per minute per IP, which means all 30 people would share that limit.

**Solution**: Enable workshop mode to increase the rate limit to 60 requests per minute per IP (allows ~2 requests per minute per person for 30 people).

### 2. Vercel Free Tier Limits

**Function Invocations**: 
- Free tier: 1 million/month
- 30 users × ~10 requests each = 300 requests per session
- ✅ Well within limits

**Function Execution Time**:
- Free tier: 100GB-hours/month
- Each transcription: ~2-5 seconds
- 30 concurrent: Should be fine ✅

**Bandwidth**:
- Free tier: 100GB/month
- Audio files: ~1-5MB each (after base64 encoding)
- 30 users × 5MB = 150MB per session
- ✅ Well within limits

### 3. Gemini API Limits

**Rate Limits** (for gemini-2.5-flash):
- Requests per minute: Check your quota in Google Cloud Console
- Default free tier: Usually 60 RPM
- 30 concurrent users: May hit limits if all transcribe simultaneously

**Quotas**:
- Check your Gemini API quotas in Google Cloud Console
- Consider requesting a quota increase if needed

## Setup Steps

### Step 1: Enable Workshop Mode

Add this to your Vercel environment variables:

```bash
WORKSHOP_MODE=true
```

This increases the rate limit from 10 to 60 requests per minute per IP (allows ~2 requests per minute per person for 30 people).

**To add in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `WORKSHOP_MODE` = `true`
3. Redeploy your application

### Step 2: Check Gemini API Quotas

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Quotas
3. Search for "Gemini API" or "Generative Language API"
4. Check your "Requests per minute" quota
5. If needed, request a quota increase (can take 24-48 hours)

### Step 3: Monitor During Workshop

**Vercel Analytics:**
- Monitor function invocations
- Watch for errors or timeouts
- Check response times

**Google Cloud Console:**
- Monitor Gemini API usage
- Watch for rate limit errors
- Check quota consumption

## Alternative Solutions

### Option A: Per-User Rate Limiting (More Complex)

If you have user authentication, you could rate limit per user instead of per IP:

```javascript
// Use user session ID instead of IP
const userId = request.headers.get('x-user-id') || clientIP;
const rateLimit = checkRateLimit(userId, 10, 60000);
```

### Option B: Temporary Disable Rate Limiting (Not Recommended)

Only for trusted workshops:

```javascript
// Only if WORKSHOP_MODE is enabled AND you trust all participants
if (isWorkshopMode && process.env.DISABLE_RATE_LIMIT === 'true') {
  // Skip rate limiting
}
```

⚠️ **Warning**: This removes protection against abuse.

### Option C: Increase Rate Limit Further

For very large workshops (50+ people), you might need to increase further:

```javascript
const maxRequests = isWorkshopMode ? 100 : 10; // Adjust based on workshop size
```

Current workshop mode: 60 req/min (good for ~30 people with multiple submissions each)

## Testing Before Workshop

### 1. Load Test Locally

```bash
# Install Apache Bench or use curl in a loop
for i in {1..30}; do
  curl -X POST http://localhost:3000/api/transcribe-audio \
    -H "Content-Type: application/json" \
    -d '{"audioData":"test"}' &
done
wait
```

### 2. Test on Vercel Preview

1. Deploy to preview branch
2. Test with multiple devices on same network
3. Verify rate limiting works correctly

### 3. Monitor First Few Requests

- Watch for cold starts (first request slower)
- Check error rates
- Verify Gemini API responses

## During Workshop

### Best Practices

1. **Stagger Usage**: Ask participants to test at different times if possible
2. **Monitor Dashboard**: Keep Vercel dashboard open to watch for issues
3. **Have Backup Plan**: If rate limits hit, pause and wait 1 minute
4. **Test Early**: Have a few people test before the main session

### If Issues Occur

**Rate Limit Errors (429)**:
- Wait 1 minute for reset
- Consider temporarily increasing limit further
- Or disable rate limiting temporarily (risky)

**Gemini API Errors**:
- Check quota in Google Cloud Console
- May need to request quota increase
- Consider upgrading Gemini API plan

**Slow Responses**:
- Cold starts are normal (first request slower)
- Subsequent requests should be faster
- Consider warming up functions (make a test request before workshop)

## Post-Workshop

1. **Disable Workshop Mode**: Set `WORKSHOP_MODE=false` or remove the variable
2. **Review Analytics**: Check usage patterns and errors
3. **Document Issues**: Note any problems for future workshops

## Recommended Settings for 30-Person Workshop

```env
# Vercel Environment Variables
WORKSHOP_MODE=true
GEMINI_API_KEY=your_key_here
```

**Expected Behavior**:
- ✅ 60 requests per minute per IP (shared WiFi)
- ✅ Should handle 30 concurrent users comfortably
- ✅ Each user can make ~2 transcriptions per minute (allows for retries and testing)
- ⚠️ If all 30 transcribe simultaneously multiple times, may hit Gemini API limits

## Cost Estimate

**Vercel**: Free tier should cover it ✅

**Gemini API**: 
- ~300 requests per workshop session
- Check your pricing plan
- Free tier usually includes generous limits

**Total**: Should be $0 or minimal cost ✅

