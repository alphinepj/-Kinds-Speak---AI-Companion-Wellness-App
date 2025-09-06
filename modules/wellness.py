"""
Wellness and mindfulness features module
"""
from flask import session, jsonify
from datetime import datetime
import random

def start_meditation_session(duration):
    """Start a meditation session"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        from .database import db
        
        meditation_data = {
            'user_id': session['user_id'],
            'duration': duration,
            'started_at': datetime.utcnow(),
            'completed': False
        }
        
        doc_ref = db.collection('meditation_sessions').add(meditation_data)
        session_id = doc_ref[1].id
        
        return {
            'session_id': session_id,
            'message': f'Meditation session started for {duration} minutes',
            'duration': duration
        }, 200
    except Exception as e:
        print(f"Error starting meditation: {e}")
        return {'error': 'Failed to start meditation session'}, 500

def complete_meditation_session(session_id):
    """Complete a meditation session"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        from .database import db
        
        # Update meditation session
        session_ref = db.collection('meditation_sessions').document(session_id)
        session_doc = session_ref.get()
        
        if not session_doc.exists:
            return {'error': 'Session not found'}, 404
        
        session_data = session_doc.to_dict()
        if session_data.get('user_id') != session['user_id']:
            return {'error': 'Unauthorized'}, 403
        
        session_ref.update({
            'completed': True,
            'completed_at': datetime.utcnow()
        })
        
        return {'message': 'Meditation session completed successfully'}, 200
    except Exception as e:
        print(f"Error completing meditation: {e}")
        return {'error': 'Failed to complete meditation session'}, 500

def get_wellness_reminders():
    """Get personalized wellness reminders"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        # Sample wellness reminders based on user activity
        reminders = [
            {
                'title': 'Hydration Check',
                'message': 'Remember to drink water! Staying hydrated helps maintain focus and energy.',
                'action': 'Drink a glass of water now',
                'priority': 'medium'
            },
            {
                'title': 'Breathing Exercise',
                'message': 'Take a moment to focus on your breathing. Deep breaths can help reduce stress.',
                'action': 'Try 4-7-8 breathing technique',
                'priority': 'high'
            },
            {
                'title': 'Posture Check',
                'message': 'How is your posture right now? Good posture can improve mood and energy.',
                'action': 'Adjust your sitting position',
                'priority': 'low'
            },
            {
                'title': 'Gratitude Moment',
                'message': 'Think of one thing you\'re grateful for today. Gratitude can boost happiness.',
                'action': 'Write down what you\'re grateful for',
                'priority': 'medium'
            },
            {
                'title': 'Movement Break',
                'message': 'Your body needs movement! Even a short walk can improve your wellbeing.',
                'action': 'Take a 5-minute walk or stretch',
                'priority': 'high'
            }
        ]
        
        # Return 3 random reminders
        selected_reminders = random.sample(reminders, min(3, len(reminders)))
        return {'reminders': selected_reminders}, 200
        
    except Exception as e:
        print(f"Error getting wellness reminders: {e}")
        return {'error': 'Failed to get wellness reminders'}, 500

def get_mindfulness_prompt():
    """Get a mindfulness exercise prompt"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    try:
        prompts = [
            {
                'title': 'Body Scan',
                'instruction': 'Close your eyes and slowly scan your body from head to toe. Notice any tension or sensations without judgment.',
                'duration': '5 minutes',
                'type': 'body_awareness'
            },
            {
                'title': 'Loving-Kindness',
                'instruction': 'Send kind thoughts to yourself: "May I be happy, may I be peaceful, may I be free from suffering."',
                'duration': '3 minutes',
                'type': 'compassion'
            },
            {
                'title': 'Mindful Breathing',
                'instruction': 'Focus on your natural breath. When your mind wanders, gently return attention to breathing.',
                'duration': '5 minutes',
                'type': 'breathing'
            },
            {
                'title': 'Gratitude Reflection',
                'instruction': 'Think of three things you\'re grateful for today. Feel the warmth of appreciation in your heart.',
                'duration': '3 minutes',
                'type': 'gratitude'
            }
        ]
        
        # Select a random prompt
        selected_prompt = random.choice(prompts)
        return {'prompt': selected_prompt}, 200
        
    except Exception as e:
        print(f"Error getting mindfulness prompt: {e}")
        return {'error': 'Failed to get mindfulness prompt'}, 500
