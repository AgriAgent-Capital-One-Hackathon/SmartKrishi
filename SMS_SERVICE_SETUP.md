# 📱 SMS Service Configuration Guide

## Overview

The SMS Fallback feature allows users to interact with SmartKrishi via SMS when the web interface is unavailable. This is particularly useful for users with limited internet connectivity.

## Configuration

The SMS service is **disabled by default**. To enable it, you need to set up an external SMS API endpoint.

### Environment Variables

Set the following environment variable to enable the SMS service:

```bash
export SMS_API_BASE_URL="https://your-sms-api-endpoint.com"
```

### Example with ngrok (for development)

1. **Start your SMS API server** (if you have one):
   ```bash
   # Example: Start a local SMS server on port 3000
   node sms-server.js
   ```

2. **Create ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

3. **Set the environment variable**:
   ```bash
   export SMS_API_BASE_URL="https://abc123.ngrok-free.app"
   ```

4. **Restart the backend**:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Production Setup

For production, you would typically use a service like:
- **Twilio** - Popular SMS API service
- **AWS SNS** - Amazon's SMS service
- **Custom SMS Gateway** - Your own SMS infrastructure

## API Endpoints Expected

Your SMS API endpoint should provide the following endpoints:

### 1. Health Check
```
GET /
Response: 200 OK
```

### 2. Send SMS
```
POST /send
Body: {
  "phone_number": "+1234567890",
  "message": "Your message here"
}
Response: 200 OK
```

### 3. Register Phone
```
POST /register/{phone_number}
Response: 200 OK
```

### 4. Receive SMS (Long Polling)
```
GET /receive
Response: {
  "from_number": "+1234567890",
  "message": "User's message",
  "timestamp": 1234567890
} | {"status": "no_new_messages"}
```

### 5. Get System Status
```
GET /status
Response: {
  "status": "active",
  "registered_numbers": 5,
  "messages_sent": 100,
  "messages_received": 50
}
```

## Fallback Mode Options

The `fallback_mode` column in the users table can have these values:

### "manual" (default)
- User manually activates/deactivates SMS fallback
- User has full control over when SMS is used
- Suitable for users who want to use SMS occasionally

### "auto" (future feature)
- System automatically activates SMS when web service is unavailable
- Seamless fallback for users with unreliable internet
- Suitable for users who rely heavily on the service

## Testing SMS Service

### Check Service Status
```bash
curl -X GET "http://localhost:8000/api/v1/fallback/sms/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test SMS Send
```bash
curl -X POST "http://localhost:8000/api/v1/fallback/sms/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone_number": "+1234567890",
    "message": "Test SMS from SmartKrishi"
  }'
```

## Troubleshooting

### SMS Service Disabled
If you see logs like:
```
📱 SMS Service disabled - SMS_API_BASE_URL environment variable not set
```

**Solution**: Set the `SMS_API_BASE_URL` environment variable and restart the backend.

### ngrok Connection Refused
If you see:
```
dial tcp 127.0.0.1:8000: connect: connection refused
```

**Solution**: 
1. Ensure your backend is running on the correct port
2. Update the ngrok tunnel to point to the correct port
3. Verify the SMS API base URL is correct

### Phone Verification Required
If fallback activation fails:
```
Failed to activate fallback. Ensure you have a verified fallback phone number.
```

**Solution**: 
1. Go to SMS Fallback Settings in the web interface
2. Enter your phone number using the country code selector
3. Click "Verify" and complete Firebase OTP verification

## Security Notes

1. **Never hardcode API URLs** in the source code
2. **Use environment variables** for configuration
3. **Validate phone numbers** before processing
4. **Implement rate limiting** to prevent SMS abuse
5. **Log all SMS activities** for audit purposes

## Integration Examples

### With Twilio
```python
# In your SMS API server
from twilio.rest import Client

client = Client(account_sid, auth_token)

async def send_sms(phone_number: str, message: str):
    message = client.messages.create(
        body=message,
        from_='+1234567890',  # Your Twilio number
        to=phone_number
    )
    return message.sid
```

### With AWS SNS
```python
import boto3

sns = boto3.client('sns', region_name='us-east-1')

async def send_sms(phone_number: str, message: str):
    response = sns.publish(
        PhoneNumber=phone_number,
        Message=message
    )
    return response['MessageId']
```

This configuration ensures the SMS fallback system works reliably while being flexible enough for different deployment scenarios.
