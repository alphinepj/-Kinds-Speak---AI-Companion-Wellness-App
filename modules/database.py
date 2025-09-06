"""
Database utilities and Firebase configuration for Kinds Speak application
"""
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Increment
import os

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase connection"""
    if not firebase_admin._apps:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
    return firestore.client()

# Initialize database connection
db = initialize_firebase()

def get_user_by_username(username):
    """Get user document by username"""
    users_ref = db.collection('users').where('username', '==', username).limit(1)
    users = list(users_ref.stream())
    return users[0] if users else None

def get_user_by_email(email):
    """Get user document by email"""
    users_ref = db.collection('users').where('email', '==', email).limit(1)
    users = list(users_ref.stream())
    return users[0] if users else None

def create_user(user_data):
    """Create a new user in Firestore"""
    doc_ref = db.collection('users').add(user_data)
    return doc_ref[1].id

def get_user_conversations(user_id, limit=20):
    """Get user conversations without ordering to avoid index requirements"""
    conversations_ref = db.collection('conversations').where('user_id', '==', user_id).limit(limit)
    conversations_data = [conv.to_dict() for conv in conversations_ref.stream()]
    
    # Sort conversations by timestamp in Python (descending order)
    from datetime import datetime
    return sorted(conversations_data, key=lambda x: x.get('timestamp', datetime.min), reverse=True)

def save_conversation(conversation_data):
    """Save conversation to Firestore"""
    return db.collection('conversations').add(conversation_data)

def create_chat_session(session_data):
    """Create a new chat session"""
    doc_ref = db.collection('chat_sessions').add(session_data)
    return doc_ref[1].id

def update_chat_session(session_id, update_data):
    """Update chat session metadata"""
    session_ref = db.collection('chat_sessions').document(session_id)
    session_ref.update(update_data)

def get_chat_session(session_id):
    """Get chat session by ID"""
    session_ref = db.collection('chat_sessions').document(session_id)
    return session_ref.get()

def get_user_chat_sessions(user_id):
    """Get all chat sessions for a user"""
    sessions_ref = db.collection('chat_sessions').where('user_id', '==', user_id).order_by('last_updated', direction=firestore.Query.DESCENDING)
    return [session.to_dict() for session in sessions_ref.stream()]

def get_session_messages(session_id):
    """Get all messages for a chat session"""
    messages_ref = db.collection('conversations').where('session_id', '==', session_id).order_by('timestamp')
    return [msg.to_dict() for msg in messages_ref.stream()]

def update_user_profile(user_id, update_data):
    """Update user profile data"""
    db.collection('users').document(user_id).update(update_data)

def get_user_stats(user_id):
    """Get user statistics for profile"""
    # Get conversation count
    conversations_ref = db.collection('conversations').where('user_id', '==', user_id)
    total_chats = len(list(conversations_ref.stream()))
    
    return {
        'total_chats': total_chats,
        'meditation_count': 0,  # Placeholder
        'day_streak': 7,        # Placeholder
        'wellness_score': 85    # Placeholder
    }
