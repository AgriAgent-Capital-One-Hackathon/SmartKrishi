# SMS Fallback Testing Guide

## Prerequisites
- Backend running on http://127.0.0.1:8000
- Frontend running on http://127.0.0.1:5173
- Phone number: +918927087113 (for testing)

## Step-by-Step Testing Process

### 1. Login to the Application
1. Open browser and go to: http://localhost:5173
2. Click "Sign In" or navigate to authentication page
3. Use these test credentials:
   - **Email**: fallback.test@smartkrishi.com
   - **Password**: FallbackTest123!

### 2. Navigate to SMS Fallback Settings
1. After login, look for a Settings icon or menu
2. Find "SMS Fallback Settings" section
3. You should see the fallback configuration interface

### 3. Configure Phone Number
1. In the phone number field, you should see the PhoneInput component with country selector
2. Enter: +918927087113 (or your preferred number)
3. The interface should show "India (+91)" as the country

### 4. Verify Phone Number
1. Click the "Verify" button
2. You should see:
   - Firebase reCAPTCHA verification (might be invisible)
   - OTP sent to your phone
   - 6-digit OTP input boxes appear
3. Enter the OTP code received on your phone
4. Click "Verify Code"

### 5. Expected Results
- ✅ Phone number should be marked as "Phone verified"
- ✅ Green checkmark should appear
- ✅ Auto fallback toggle should become enabled
- ✅ Success message: "Phone number verified successfully!"

### 6. Enable Automatic Fallback
1. Toggle the "Automatic SMS Fallback" switch to ON
2. You should see confirmation that auto fallback is active

### 7. Test Manual Activation (Optional)
1. Use the test script to manually activate fallback:
```bash
python test_sms_fallback_complete.py
```

## Common Issues and Solutions

### Issue: "Firebase token verification failed"
- **Cause**: Firebase configuration issue or token format problem
- **Solution**: Check browser console for detailed Firebase errors

### Issue: "Phone number in token does not match"
- **Cause**: The phone number from Firebase doesn't match the stored fallback phone
- **Solution**: Ensure the same phone number is used in both places

### Issue: "No authentication token found"
- **Cause**: User not logged in or token expired
- **Solution**: Refresh page and login again

### Issue: Backend 400 error
- **Cause**: Various validation issues
- **Solution**: Check backend logs for specific error details

## Backend Logs to Watch
The backend will show detailed logs like:
```
INFO: Verifying phone for user X with token: eyJhbGci...
INFO: Firebase token verified successfully: {'phone_number': '+918927087113', ...}
INFO: Token phone: +918927087113, User fallback phone: +918927087113
INFO: Phone verification successful for user X
```

## Verification Success Criteria
1. ✅ PhoneInput component loads with country selector
2. ✅ Firebase OTP is sent successfully
3. ✅ OTP input boxes appear and work correctly
4. ✅ Backend receives and validates Firebase token
5. ✅ Phone number is marked as verified in database
6. ✅ UI updates to show verified status
7. ✅ Auto fallback can be enabled

## Additional Testing
After successful verification, you can test:
- SMS fallback activation/deactivation
- Fallback chat simulation
- Network quality monitoring
- Automatic fallback triggering

## Debugging Tips
1. Open browser Developer Tools (F12)
2. Watch Console tab for errors
3. Check Network tab for API requests/responses
4. Monitor backend terminal for detailed logs
