# Best Gemini Models for Free Tier & Image Text Extraction

## ✅ Recommended Models (Best to Good)

### 1. **`models/gemini-flash-lite-latest`** ⭐ BEST CHOICE
   - **Why**: Optimized specifically for free tier
   - **Quota**: Highest free tier limits
   - **Cost**: Lowest cost per request
   - **Image Support**: ✅ Full vision capabilities
   - **Speed**: Fast response times
   - **Status**: Currently set in server.js

### 2. **`models/gemini-2.0-flash-lite`**
   - **Why**: Stable lite version, good free tier support
   - **Quota**: Good free tier limits
   - **Cost**: Low cost per request
   - **Image Support**: ✅ Full vision capabilities
   - **Speed**: Fast response times

### 3. **`models/gemini-2.5-flash-lite`**
   - **Why**: Newer lite version with improved capabilities
   - **Quota**: Good free tier limits
   - **Cost**: Low cost per request
   - **Image Support**: ✅ Full vision capabilities
   - **Speed**: Fast response times

### 4. **`models/gemini-flash-latest`** (Non-lite alternative)
   - **Why**: Latest flash model, good balance
   - **Quota**: Moderate free tier limits
   - **Cost**: Moderate cost per request
   - **Image Support**: ✅ Full vision capabilities
   - **Speed**: Very fast

## ❌ Avoid for Free Tier

- **`models/gemini-2.0-flash`** - Higher cost, lower free tier quota
- **`models/gemini-2.5-flash`** - Higher cost, lower free tier quota
- **`models/gemini-pro-latest`** - Pro models have very limited free tier
- **`models/gemini-1.5-flash`** - Deprecated, no longer available

## 📊 Comparison for Image Text Extraction

| Model | Free Tier Quota | Cost | Speed | Image OCR Quality |
|-------|----------------|------|-------|-------------------|
| gemini-flash-lite-latest | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| gemini-2.0-flash-lite | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| gemini-2.5-flash-lite | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| gemini-flash-latest | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🔧 How to Change Model

Edit `backend/server.js` line 113:

```javascript
model: "models/gemini-flash-lite-latest", // Change this
```

## 💡 Tips for Free Tier

1. **Use Lite Models**: Always prefer models with "lite" in the name for free tier
2. **Batch Requests**: Group multiple image extractions when possible
3. **Monitor Quota**: Check usage at https://ai.dev/usage?tab=rate-limit
4. **Error Handling**: The code already has retry logic for rate limits
5. **Image Size**: Smaller images = lower token costs = more requests

## 🎯 Current Configuration

Your server is currently using: **`models/gemini-flash-lite-latest`**

This is the optimal choice for:
- ✅ Maximum free tier quota
- ✅ Lowest cost per request
- ✅ Good image text extraction quality
- ✅ Fast response times

