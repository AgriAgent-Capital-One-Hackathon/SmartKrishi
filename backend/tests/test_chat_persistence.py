import requests
import json

# Test the new chat persistence endpoints
BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_chat_endpoints():
    # First login to get a token
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print("Login failed:", login_response.text)
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Test getting chat suggestions
    suggestions_response = requests.get(f"{BASE_URL}/chat/suggestions", headers=headers)
    if suggestions_response.status_code == 200:
        print("✅ Suggestions endpoint working")
        print(f"   Found {len(suggestions_response.json()['suggestions'])} suggestions")
    else:
        print("❌ Suggestions endpoint failed:", suggestions_response.text)
    
    # Test sending a message (creates new chat)
    send_response = requests.post(f"{BASE_URL}/chat/send", 
                                 headers=headers, 
                                 json={"message": "What are the best crops for winter?"})
    
    if send_response.status_code == 200:
        print("✅ Send message endpoint working")
        data = send_response.json()
        chat_id = data["chat_id"]
        print(f"   Created chat ID: {chat_id}")
        
        # Test getting chats list
        chats_response = requests.get(f"{BASE_URL}/chat/chats", headers=headers)
        if chats_response.status_code == 200:
            print("✅ Get chats endpoint working")
            chats = chats_response.json()
            print(f"   Found {len(chats)} chats")
        else:
            print("❌ Get chats endpoint failed:", chats_response.text)
        
        # Test getting specific chat
        chat_response = requests.get(f"{BASE_URL}/chat/chats/{chat_id}", headers=headers)
        if chat_response.status_code == 200:
            print("✅ Get specific chat endpoint working")
            chat_data = chat_response.json()
            print(f"   Chat has {len(chat_data['messages'])} messages")
        else:
            print("❌ Get specific chat endpoint failed:", chat_response.text)
            
    else:
        print("❌ Send message endpoint failed:", send_response.text)

if __name__ == "__main__":
    test_chat_endpoints()
