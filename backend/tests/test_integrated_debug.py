#!/usr/bin/env python3

import asyncio
import logging
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from uuid import uuid4
from app.services.integrated_chat_service import IntegratedChatService
from app.db.database import SessionLocal

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s:%(name)s:%(message)s'
)

async def test_integrated_service():
    """Test the integrated chat service with debug logging"""
    db = SessionLocal()
    service = IntegratedChatService()
    
    print('🧪 Testing Integrated Chat Service')
    print('=' * 50)
    
    try:
        events = []
        chat_id = uuid4()
        print(f'📝 Using chat ID: {chat_id}')
        
        async for event in service.send_message_stream(
            db=db,
            user_id=1,  # Assuming user exists from auth tests
            chat_id=chat_id,
            message='What are the best ways to grow rice in summer?',
            model='gemini-2.0-flash-exp',
            include_logs=True
        ):
            events.append(event)
            print(f'📦 Event [{len(events)}]: {event}')
            
            if len(events) > 20:  # Safety limit
                print('🛑 Stopping after 20 events')
                break
        
        print(f'✅ Total events received: {len(events)}')
        
        # Analyze events
        event_types = {}
        for event in events:
            event_type = event.get('type', 'unknown')
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        print(f'📊 Event type summary: {event_types}')
        
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_integrated_service())
