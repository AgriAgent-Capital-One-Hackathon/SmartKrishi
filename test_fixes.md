# Test Plan for Chat Issues Fix

## Issues Fixed:

### 1. Duplicate User Message Bubble on First Normal Query
**Fix Applied**: Removed duplicate user message creation in `DashboardPage.tsx` for text messages. Now only `useStreamingChat.ts` creates the user message.

**Test Steps**:
1. Upload files with messages first
2. Send a normal text query immediately after
3. Verify only ONE user message bubble appears
4. Send another text query and verify it still works normally

### 2. Uploaded Files Not Persisting in Correct Format After Reloading
**Fix Applied**: 
- Updated `UploadedFile` interface to include missing backend fields
- Updated `Chat` interface to include files field in messages
- Modified `handleChatSelect` to use files directly from backend response instead of separate API call

**Test Steps**:
1. Upload files in a chat session with proper card format
2. Navigate away from the chat
3. Reopen chat from history drawer
4. Verify files appear in same card format as during live chat

### 3. Reasoning Steps Missing After Reloading from History
**Fix Applied**:
- Made reasoning step filtering more lenient in `handleChatSelect`
- Only filter out response-related logs, keep thinking steps and other event types
- Added support for more event types like `url_context` and `web_search`
- Fixed syntax error in streaming hook

**Test Steps**:
1. Have a conversation with AI that shows reasoning steps during live processing
2. Navigate away from the chat  
3. Reopen chat from history drawer
4. Verify reasoning steps appear exactly as they did during live processing (excluding citations as intended)

## Files Modified:
- `/frontend/src/pages/DashboardPage.tsx`
- `/frontend/src/services/chatService.ts` 
- `/frontend/src/hooks/useStreamingChat.ts`

## Backend Dependencies:
- Assumes backend properly loads files via SQLAlchemy relationships in chat messages
- Assumes backend includes reasoning steps in chat message responses
