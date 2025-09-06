"""
Profile management module for user profile operations
"""
from flask import session, jsonify, request, render_template, redirect, url_for
from datetime import datetime
from .database import (
    db, get_user_by_username, get_user_by_email, 
    update_user_profile, get_user_conversations, get_user_stats
)

def get_profile_page():
    """Render profile page with user data"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    user_id = session['user_id']
    
    # Get user data
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        return redirect(url_for('logout'))
    
    user = user_doc.to_dict()
    
    # Get recent conversations
    conversations = get_user_conversations(user_id, limit=10)
    
    # Get recent meditation sessions (placeholder)
    meditation_sessions = []
    
    return render_template('profile.html', user=user, conversations=conversations, meditation_sessions=meditation_sessions)

def update_profile(data):
    """Update user profile information"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    user_id = session['user_id']
    update_data = {}
    
    # Validate and prepare update data
    if 'username' in data:
        username = data['username'].strip()
        if not username:
            return {'error': 'Username cannot be empty'}, 400
        
        # Check if username is already taken by another user
        existing_user = get_user_by_username(username)
        if existing_user and existing_user.id != user_id:
            return {'error': 'Username already taken'}, 400
        
        update_data['username'] = username
    
    if 'email' in data:
        email = data['email'].strip().lower()
        if not email:
            return {'error': 'Email cannot be empty'}, 400
        
        # Check if email is already taken by another user
        existing_user = get_user_by_email(email)
        if existing_user and existing_user.id != user_id:
            return {'error': 'Email already taken'}, 400
        
        update_data['email'] = email
    
    if 'bio' in data:
        update_data['bio'] = data['bio'].strip()
    
    if 'preferences' in data:
        update_data['preferences'] = data['preferences']
    
    if not update_data:
        return {'error': 'No valid fields to update'}, 400
    
    update_data['updated_at'] = datetime.utcnow()
    
    try:
        update_user_profile(user_id, update_data)
        return {'message': 'Profile updated successfully', 'updated_fields': list(update_data.keys())}, 200
    except Exception as e:
        print(f"Error updating profile: {e}")
        return {'error': 'Failed to update profile'}, 500

def update_preferences(preferences):
    """Update user preferences"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    user_id = session['user_id']
    
    # Validate preference structure
    valid_preferences = [
        'camera_emotion_detection',
        'voice_input',
        'wellness_reminders',
        'music_therapy',
        'daily_mood_tracking',
        'analytics_dashboard'
    ]
    
    filtered_preferences = {}
    for key, value in preferences.items():
        if key in valid_preferences and isinstance(value, bool):
            filtered_preferences[key] = value
    
    try:
        update_user_profile(user_id, {
            'preferences': filtered_preferences,
            'updated_at': datetime.utcnow()
        })
        return {'message': 'Preferences updated successfully'}, 200
    except Exception as e:
        print(f"Error updating preferences: {e}")
        return {'error': 'Failed to update preferences'}, 500

def get_profile_statistics():
    """Get user profile statistics"""
    if 'user_id' not in session:
        return {'error': 'Not authenticated'}, 401
    
    user_id = session['user_id']
    
    try:
        # Get basic stats
        basic_stats = get_user_stats(user_id)
        
        # Get recent activity for wellness metrics
        recent_conversations = get_user_conversations(user_id, limit=20)
        
        # Calculate average mood from recent conversations
        mood_scores = []
        for conv in recent_conversations:
            emotions = conv.get('emotions', [])
            for emotion in emotions:
                if emotion.get('emotion') in ['joy', 'happiness']:
                    mood_scores.append(8)
                elif emotion.get('emotion') in ['sadness', 'anger']:
                    mood_scores.append(3)
                else:
                    mood_scores.append(6)
        
        average_mood = sum(mood_scores) / len(mood_scores) if mood_scores else 7.0
        
        stats = {
            **basic_stats,
            'average_mood': round(average_mood, 1),
            'energy_level': 6.8,  # Placeholder
            'stress_level': 4.2,   # Placeholder
            'mindful_minutes': 12  # Placeholder
        }
        
        return stats, 200
    except Exception as e:
        print(f"Error getting profile stats: {e}")
        return {'error': 'Failed to get stats'}, 500
