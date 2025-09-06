"""
Chat and conversation management module
"""
from flask import session, jsonify, request
from datetime import datetime
import google.generativeai as genai
from .database import (
    create_chat_session, update_chat_session, get_chat_session,
    save_conversation, get_user_chat_sessions, get_session_messages
)
from .emotions import detect_emotions
from google.cloud.firestore import Increment

# Initialize Gemini AI
def initialize_gemini(api_key):
    """Initialize Gemini AI model"""
    if api_key:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini AI initialized successfully")
        return model
    else:
        print("⚠️  GEMINI_API_KEY not found. Using fallback responses.")
        return None

def generate_ai_response(message, emotion_context="", model=None):
    """Generate AI response using Gemini or fallback"""
    try:
        if model:
            # Include emotion context in the prompt for more empathetic responses
            prompt = f"""You are a calm, supportive AI companion focused on mindfulness and well-being.{emotion_context}
            Respond to the user's message in a helpful, empathetic way. Keep responses concise and encouraging.
            
            User message: {message}"""
            
            gemini_response = model.generate_content(prompt)
            return gemini_response.text
        else:
            # Fallback to keyword-based responses
            message_lower = message.lower()
            if 'hello' in message_lower:
                return "Hello! How can I help you today?"
            elif 'how are you' in message_lower:
                return "I'm doing well, thank you for asking! How about you?"
            elif 'meditation' in message_lower:
                return "Meditation is a great practice for mindfulness. Would you like to start a session?"
            elif 'help' in message_lower:
                return "I'm here to help! You can chat with me, track meditation sessions, or manage your profile."
            else:
                return "That's interesting! Tell me more about it."
    except Exception as e:
        print(f"Error generating AI response: {e}")
        return "I'm here to help! Could you tell me more about what you'd like to discuss?"

def process_chat_message(message, session_id=None, image_emotion=None, model=None):
    """Process a chat message and return response"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    user_id = session['user_id']
    
    # Create new session if none provided
    if not session_id:
        # Generate title from first few words of message
        title_words = message.split()[:4]
        title = ' '.join(title_words) + ('...' if len(message.split()) > 4 else '')
        
        session_data = {
            'user_id': user_id,
            'title': title,
            'created_at': datetime.utcnow(),
            'last_updated': datetime.utcnow(),
            'message_count': 0
        }
        session_id = create_chat_session(session_data)
    else:
        # Validate existing session
        session_doc = get_chat_session(session_id)
        if not session_doc.exists or session_doc.to_dict().get('user_id') != user_id:
            return {'error': 'Session not found'}, 404
    
    # Detect emotions in user message
    emotion_data = detect_emotions(message)
    
    # Combine text and image emotions for context
    combined_emotion_context = ""
    if emotion_data['dominant_emotion'] != 'neutral':
        combined_emotion_context += f" The user's text shows {emotion_data['dominant_emotion']}."
    
    if image_emotion and image_emotion.get('emotion') != 'neutral':
        # Check if image emotion is recent (within last 10 seconds)
        if (datetime.utcnow().timestamp() * 1000 - image_emotion.get('timestamp', 0)) < 10000:
            combined_emotion_context += f" Their facial expression shows {image_emotion['emotion']}."
    
    # Generate AI response
    response = generate_ai_response(message, combined_emotion_context, model)
    
    # Save conversation to database
    conversation_data = {
        'user_id': user_id,
        'session_id': session_id,
        'message': message,
        'response': response,
        'emotions': emotion_data['emotions'],
        'dominant_emotion': emotion_data['dominant_emotion'],
        'image_emotion': image_emotion if image_emotion else None,
        'timestamp': datetime.utcnow()
    }
    save_conversation(conversation_data)
    
    # Update session metadata
    update_chat_session(session_id, {
        'last_updated': datetime.utcnow(),
        'message_count': Increment(1)
    })
    
    return {
        'response': response,
        'emotions': emotion_data['emotions'],
        'dominant_emotion': emotion_data['dominant_emotion'],
        'session_id': session_id
    }, 200

def get_user_sessions():
    """Get all chat sessions for current user"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        sessions = get_user_chat_sessions(session['user_id'])
        # Add session ID to each session
        for i, sess in enumerate(sessions):
            sessions[i]['id'] = sess.get('id', f'session_{i}')
        return sessions, 200
    except Exception as e:
        print(f"Error getting chat sessions: {e}")
        return {'error': 'Failed to get sessions'}, 500

def get_session_conversation(session_id):
    """Get all messages for a specific session"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        # Verify session belongs to user
        session_doc = get_chat_session(session_id)
        if not session_doc.exists or session_doc.to_dict().get('user_id') != session['user_id']:
            return {'error': 'Session not found'}, 404
        
        messages = get_session_messages(session_id)
        return messages, 200
    except Exception as e:
        print(f"Error getting session messages: {e}")
        return {'error': 'Failed to get messages'}, 500

def delete_chat_session(session_id):
    """Delete a chat session and its messages"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        # Verify session belongs to user
        session_doc = get_chat_session(session_id)
        if not session_doc.exists or session_doc.to_dict().get('user_id') != session['user_id']:
            return {'error': 'Session not found'}, 404
        
        # Delete session document
        from .database import db
        db.collection('chat_sessions').document(session_id).delete()
        
        # Delete all messages in the session
        messages_ref = db.collection('conversations').where('session_id', '==', session_id)
        for msg in messages_ref.stream():
            msg.reference.delete()
        
        return {'message': 'Session deleted successfully'}, 200
    except Exception as e:
        print(f"Error deleting session: {e}")
        return {'error': 'Failed to delete session'}, 500
