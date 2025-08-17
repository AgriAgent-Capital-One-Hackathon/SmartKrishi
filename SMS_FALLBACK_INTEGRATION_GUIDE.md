# SMS Fallback System - Integration Guide

This guide provides complete integration examples for the SMS fallback system that has been implemented in your SmartKrishi chat application.

## 🏗️ Architecture Overview

### Backend Components
- **Models**: Extended User, Chat models; New FallbackSession, FallbackMessage models
- **Services**: SMS API integration, fallback logic, network health monitoring
- **Routers**: Complete API endpoints for fallback management
- **Database**: Alembic migrations applied for all schema changes

### Frontend Components
- **Settings**: FallbackSettings component for user configuration
- **Status**: FallbackStatus component showing connection/fallback state
- **Sidebar**: Enhanced ChatSidebar separating normal/fallback chats
- **Messages**: MessageActions, MessageEdit for enhanced UX
- **Alerts**: Alert system for user notifications

## 🔧 Backend Integration

### 1. API Endpoints Available

```python
# Fallback Settings
GET    /api/v1/fallback/settings          # Get user's fallback settings
PUT    /api/v1/fallback/settings          # Update fallback settings

# Fallback Activation
POST   /api/v1/fallback/activate          # Manually activate fallback mode
POST   /api/v1/fallback/deactivate        # Manually deactivate fallback mode

# Network Health
GET    /api/v1/fallback/health            # Get network health status
POST   /api/v1/fallback/health-check      # Trigger health check

# SMS Operations
POST   /api/v1/fallback/sms/send          # Send SMS message
POST   /api/v1/fallback/sms/receive       # Receive SMS message
GET    /api/v1/fallback/sms/history       # Get SMS message history

# Message Management
PUT    /api/v1/fallback/messages/{id}/edit # Edit a message
```

### 2. Using the Fallback Service

```python
from app.services.fallback_service import FallbackService
from app.services.sms_service import SMSService

# Initialize services
fallback_service = FallbackService()
sms_service = SMSService()

# Check if user should be in fallback mode
should_fallback = await fallback_service.should_activate_fallback(user_id)

# Send message via SMS
sms_response = await sms_service.send_sms(
    phone_number="+1234567890",
    message="Your farming advice...",
    user_id=user_id
)

# Monitor network health
health_status = await fallback_service.get_network_health(user_id)
```

### 3. Database Models Usage

```python
from app.models.user import User
from app.models.fallback import FallbackSession, FallbackMessage

# Check user's fallback settings
user = await User.get(user_id)
if user.auto_fallback_enabled and user.fallback_phone_verified:
    # User has fallback configured
    
# Create fallback session
fallback_session = FallbackSession(
    user_id=user_id,
    phone_number=user.fallback_phone,
    status="active"
)

# Log fallback message
fallback_msg = FallbackMessage(
    session_id=session.id,
    content="Message content",
    direction="outbound",
    sms_id="external_sms_id"
)
```

## 🖥️ Frontend Integration

### 1. Dashboard Integration

The `EnhancedDashboard` component shows how to integrate all fallback components:

```tsx
import { EnhancedDashboard } from './components/EnhancedDashboard';

// Use in your app
function App() {
  return <EnhancedDashboard />;
}
```

### 2. Individual Component Usage

```tsx
import { FallbackSettings } from './components/ui/fallback-settings';
import { FallbackStatus } from './components/ui/fallback-status';
import { ChatSidebar } from './components/ui/enhanced-chat-sidebar';

// Settings panel
<FallbackSettings />

// Status indicator in header
<FallbackStatus onOpenSettings={() => setShowSettings(true)} />

// Enhanced sidebar with fallback separation
<ChatSidebar
  currentChatId={currentChatId}
  onChatSelect={handleChatSelect}
  onNewChat={handleNewChat}
/>
```

### 3. Message Actions Integration

```tsx
import MessageActions from './components/ui/message-actions';
import { MessageEdit } from './components/ui/message-edit';

// In your message rendering
{messages.map((message) => (
  <div key={message.id} className="message-container">
    {editingMessageId === message.id ? (
      <MessageEdit
        messageId={message.id}
        originalContent={message.content}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
      />
    ) : (
      <div className="message-content">
        {message.content}
        <MessageActions
          messageId={message.id}
          role={message.role}
          content={message.content}
          onCopy={handleCopyMessage}
          onEdit={message.role === 'user' ? handleEditMessage : undefined}
          isEditable={message.role === 'user' && !message.fallback_type}
        />
      </div>
    )}
  </div>
))}
```

## 🔌 API Integration Examples

### 1. Fallback Settings Management

```javascript
// Get user's current fallback settings
const getSettings = async () => {
  const response = await fetch('/api/v1/fallback/settings', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Update fallback settings
const updateSettings = async (settings) => {
  const response = await fetch('/api/v1/fallback/settings', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};
```

### 2. SMS Operations

```javascript
// Send SMS message
const sendSMS = async (phoneNumber, message) => {
  const response = await fetch('/api/v1/fallback/sms/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone_number: phoneNumber,
      message: message
    })
  });
  return response.json();
};

// Get SMS history
const getSMSHistory = async () => {
  const response = await fetch('/api/v1/fallback/sms/history', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 3. Message Editing

```javascript
// Edit a message
const editMessage = async (messageId, newContent) => {
  const response = await fetch(`/api/v1/fallback/messages/${messageId}/edit`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: newContent })
  });
  return response.ok;
};
```

## 🎯 UX Flow Examples

### 1. Automatic Fallback Activation

```javascript
// Monitor network health and auto-activate fallback
const monitorNetworkHealth = async () => {
  const health = await fetch('/api/v1/fallback/health').then(r => r.json());
  
  if (health.connection_quality === 'poor' && health.should_activate_fallback) {
    // Show notification to user
    showAlert('Poor connection detected. Switching to SMS fallback mode.', 'info');
    
    // UI will automatically reflect fallback status
    // FallbackStatus component will show "SMS Active"
  }
};

// Call periodically
setInterval(monitorNetworkHealth, 30000); // Every 30 seconds
```

### 2. Manual Fallback Toggle

```javascript
// User manually toggles fallback mode
const toggleFallbackMode = async (activate) => {
  const endpoint = activate ? 'activate' : 'deactivate';
  const response = await fetch(`/api/v1/fallback/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const message = activate 
      ? 'SMS fallback mode activated. You will receive messages via SMS.'
      : 'SMS fallback mode deactivated. Returning to normal chat.';
    showAlert(message, 'success');
  }
};
```

### 3. Message Edit Flow

```javascript
// Complete message edit flow
const handleMessageEdit = (messageId) => {
  setEditingMessageId(messageId);
};

const handleSaveEdit = async (messageId, newContent) => {
  const success = await editMessage(messageId, newContent);
  if (success) {
    setEditingMessageId(null);
    showAlert('Message edited successfully. Conversation will continue from here.', 'success');
    // Reload messages to reflect changes
    await loadMessages();
  } else {
    showAlert('Failed to edit message. Please try again.', 'error');
  }
};
```

## 📱 Mobile Considerations

### 1. Phone Input Validation
```javascript
// Validate phone numbers before saving
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};
```

### 2. SMS Verification Flow
```javascript
// Send verification code
const sendVerificationCode = async (phoneNumber) => {
  const response = await fetch('/api/v1/fallback/verify-phone', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone_number: phoneNumber })
  });
  return response.json();
};

// Verify code
const verifyPhone = async (phoneNumber, code) => {
  const response = await fetch('/api/v1/fallback/verify-phone/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      phone_number: phoneNumber, 
      verification_code: code 
    })
  });
  return response.json();
};
```

## 🧪 Testing

### 1. Backend Testing
```bash
# Test fallback endpoints
cd backend
python -m pytest tests/test_fallback_api.py -v

# Test SMS integration
python test_sms_integration.py
```

### 2. Frontend Testing
```bash
# Test components
cd frontend
npm test -- --testPathPattern=fallback
```

## 🚀 Deployment Notes

### 1. Environment Variables
```env
# SMS API Configuration
SMS_API_BASE_URL=https://api.sms-provider.com
SMS_API_KEY=your_sms_api_key
SMS_SENDER_ID=SmartKrishi

# Fallback Configuration
FALLBACK_PHONE_VERIFICATION_TIMEOUT=300  # 5 minutes
FALLBACK_SESSION_TIMEOUT=86400           # 24 hours
NETWORK_HEALTH_CHECK_INTERVAL=30         # 30 seconds
```

### 2. Database Migration
```bash
# Apply the fallback migration (already done)
cd backend
alembic upgrade head
```

## 🔍 Monitoring

### 1. Health Checks
- Monitor `/api/v1/fallback/health` endpoint
- Track fallback activation rates
- Monitor SMS delivery success rates

### 2. Metrics to Track
- Fallback session duration
- SMS message volume
- User satisfaction with fallback mode
- Network quality correlations

## 🆘 Troubleshooting

### Common Issues
1. **SMS not sending**: Check SMS API credentials and phone number format
2. **Fallback not activating**: Verify network health monitoring is running
3. **Message edit not working**: Check message ownership and fallback status
4. **Phone verification failing**: Verify SMS provider configuration

This integration guide provides everything needed to fully implement and customize the SMS fallback system in your SmartKrishi application.
