# Audio Transcription API Security

## Overview

The audio transcription API (`/api/transcribe-audio`) includes multiple layers of protection against abuse and bot attacks.

## Built-in Protections

### 1. Vercel Platform Protections

Vercel provides several built-in security features:

- **DDoS Protection**: Automatic protection against distributed denial-of-service attacks
- **Bot Protection**: Can be enabled in Vercel Dashboard → Project Settings → Firewall
  - **Bot Protection Managed Ruleset**: Challenges non-browser traffic
  - **BotID**: Invisible bot detection powered by Kasada (optional, requires setup)
- **Web Application Firewall (WAF)**: Custom rules for blocking/challenging requests
- **Rate Limiting via WAF**: Can be configured in firewall settings

**To enable Vercel Bot Protection:**
1. Go to Vercel Dashboard → Your Project → Settings → Firewall
2. Enable "Bot Protection" managed ruleset
3. Optionally configure custom WAF rules for additional protection

### 2. Application-Level Protections

The API route includes the following security measures:

#### Rate Limiting
- **Limit**: 10 requests per minute per IP address
- **Window**: 60 seconds
- **Response**: Returns HTTP 429 (Too Many Requests) when exceeded
- **Headers**: Includes rate limit information in response headers

**Note**: Current implementation uses in-memory storage (per serverless function instance). For production with high traffic, consider:
- **Vercel KV**: Distributed rate limiting across all function instances
- **Upstash**: Serverless Redis for rate limiting
- **Vercel Edge Config**: For lightweight distributed state

#### Request Validation

1. **Audio Data Size**: Validates that audio doesn't exceed 20MB (Gemini API limit)
2. **MIME Type Validation**: Only allows supported audio formats:
   - `audio/wav`
   - `audio/mp3` / `audio/mpeg`
   - `audio/aiff`
   - `audio/aac`
   - `audio/ogg`
   - `audio/flac`
3. **Field ID Validation**: Validates that fieldId is from allowed list
4. **Required Fields**: Validates presence of required parameters

#### Input Sanitization

- Base64 data validation
- Size estimation (base64 is ~33% larger than binary)
- MIME type whitelist approach

## Current Limitations

1. **In-Memory Rate Limiting**: Works per serverless function instance, not globally
   - Multiple instances = multiple rate limit buckets
   - Solution: Use Vercel KV or Upstash for distributed rate limiting

2. **No Authentication**: API is publicly accessible
   - If this is a private application, consider adding authentication
   - Options: API keys, JWT tokens, session-based auth

3. **IP-Based Rate Limiting**: Can be bypassed with VPN/proxy
   - Consider adding user-based rate limiting if you have authentication
   - Or use more sophisticated bot detection

## Recommendations for Production

### High Priority

1. **Enable Vercel Bot Protection**
   ```bash
   # Via Vercel Dashboard:
   Settings → Firewall → Enable "Bot Protection"
   ```

2. **Add Distributed Rate Limiting**
   - Install `@upstash/ratelimit` or use Vercel KV
   - Replace in-memory rate limiter with distributed solution

3. **Monitor API Usage**
   - Set up Vercel Analytics
   - Monitor Gemini API usage/quotas
   - Set up alerts for unusual traffic patterns

### Medium Priority

4. **Add Request Signing** (if needed)
   - Generate tokens on frontend
   - Validate tokens in API route
   - Prevents direct API access without going through UI

5. **Implement CAPTCHA** (if abuse continues)
   - Add reCAPTCHA or hCaptcha to microphone button
   - Only required for suspicious traffic patterns

6. **Add Request Logging**
   - Log all transcription requests
   - Track patterns of abuse
   - Set up alerts for anomalies

### Optional Enhancements

7. **User Authentication** (if private app)
   - Add login system
   - Rate limit per authenticated user
   - Track usage per user

8. **Geographic Restrictions** (if needed)
   - Use Vercel WAF to block specific countries
   - Or allow only specific regions

9. **Time-Based Restrictions**
   - Limit API access to certain hours
   - Or implement usage quotas per day/week

## Monitoring

### Key Metrics to Track

1. **Request Rate**: Requests per minute/hour
2. **Error Rate**: 429 (rate limit) vs 200 (success) responses
3. **Gemini API Usage**: Track API costs and quotas
4. **IP Addresses**: Identify patterns of abuse
5. **Audio File Sizes**: Detect attempts to abuse with large files

### Setting Up Alerts

```javascript
// Example: Alert if rate limit exceeded > 50 times in 5 minutes
// Can be set up in Vercel Analytics or external monitoring service
```

## Testing Security

### Manual Testing

1. **Rate Limiting Test**:
   ```bash
   # Send 11 requests rapidly
   for i in {1..11}; do
     curl -X POST https://your-app.vercel.app/api/transcribe-audio \
       -H "Content-Type: application/json" \
       -d '{"audioData":"test"}'
   done
   # 11th request should return 429
   ```

2. **Size Validation Test**:
   ```bash
   # Send request with oversized audio (simulated)
   # Should return 400 error
   ```

3. **MIME Type Test**:
   ```bash
   # Send request with invalid MIME type
   # Should return 400 error
   ```

## Cost Protection

### Gemini API Quotas

- Monitor your Gemini API usage in Google Cloud Console
- Set up billing alerts
- Consider implementing daily/monthly usage limits

### Vercel Function Limits

- Free tier: 100GB-hours/month
- Monitor function execution time and invocations
- Optimize audio processing if needed

## Additional Resources

- [Vercel Bot Management](https://vercel.com/docs/bot-management)
- [Vercel WAF Documentation](https://vercel.com/docs/security/web-application-firewall)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)

