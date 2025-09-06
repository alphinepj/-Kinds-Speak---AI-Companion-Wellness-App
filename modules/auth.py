"""
Authentication module for user registration, login, and session management
"""
from flask import session, redirect, url_for, jsonify, render_template, request, flash
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import secrets
import requests
import os
from .database import get_user_by_username, get_user_by_email, create_user, db

def register_user(username, email, password):
    """Register a new user"""
    # Check if username already exists
    if get_user_by_username(username):
        return {'error': 'Username already exists'}, 400
    
    # Check if email already exists
    if get_user_by_email(email):
        return {'error': 'Email already exists'}, 400
    
    # Create password hash
    password_hash = generate_password_hash(password)
    
    # Prepare user data
    user_data = {
        'username': username,
        'email': email,
        'password_hash': password_hash,
        'created_at': datetime.utcnow(),
        'preferences': {
            'camera_emotion_detection': True,
            'voice_input': True,
            'wellness_reminders': True,
            'music_therapy': True,
            'daily_mood_tracking': True,
            'analytics_dashboard': True
        }
    }
    
    try:
        user_id = create_user(user_data)
        print(f"User created successfully with ID: {user_id}")
        return {'message': 'User created successfully'}, 200
    except Exception as e:
        print(f"Error creating user: {e}")
        return {'error': 'Registration failed'}, 500

def login_user(username, password):
    """Authenticate user login"""
    user_doc = get_user_by_username(username)
    
    if not user_doc:
        return {'error': 'Invalid username or password'}, 401
    
    user_data = user_doc.to_dict()
    
    if not check_password_hash(user_data['password_hash'], password):
        return {'error': 'Invalid username or password'}, 401
    
    # Set session
    session['user_id'] = user_doc.id
    session['username'] = user_data['username']
    
    return {'message': 'Login successful'}, 200

def logout_user():
    """Clear user session"""
    session.clear()
    return redirect(url_for('login'))

def require_auth(f):
    """Decorator to require authentication for routes"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def get_current_user():
    """Get current logged-in user data"""
    if 'user_id' not in session:
        return None
    
    user_doc = db.collection('users').document(session['user_id']).get()
    if not user_doc.exists:
        return None
    
    return user_doc.to_dict()

# OAuth Configuration
OAUTH_PROVIDERS = {
    'google': {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
        'token_url': 'https://oauth2.googleapis.com/token',
        'userinfo_url': 'https://www.googleapis.com/oauth2/v2/userinfo',
        'scopes': ['openid', 'email', 'profile']
    },
    'github': {
        'client_id': os.environ.get('GITHUB_CLIENT_ID'),
        'client_secret': os.environ.get('GITHUB_CLIENT_SECRET'),
        'authorize_url': 'https://github.com/login/oauth/authorize',
        'token_url': 'https://github.com/login/oauth/access_token',
        'userinfo_url': 'https://api.github.com/user',
        'scopes': ['user:email']
    }
}

def get_oauth_user_by_provider_id(provider, provider_id):
    """Get user by OAuth provider ID"""
    try:
        users_ref = db.collection('users')
        query = users_ref.where(f'oauth.{provider}.id', '==', str(provider_id))
        docs = list(query.stream())
        return docs[0] if docs else None
    except Exception as e:
        print(f"Error getting OAuth user: {e}")
        return None

def create_oauth_user(provider, user_info):
    """Create user from OAuth provider information"""
    try:
        # Extract user data based on provider
        if provider == 'google':
            username = user_info.get('email', '').split('@')[0]
            email = user_info.get('email')
            name = user_info.get('name', username)
            avatar_url = user_info.get('picture')
            provider_id = user_info.get('id')
        elif provider == 'github':
            username = user_info.get('login')
            email = user_info.get('email') or f"{username}@github.local"
            name = user_info.get('name') or username
            avatar_url = user_info.get('avatar_url')
            provider_id = user_info.get('id')
        else:
            return None, 400
        
        # Check if username exists, if so, append random suffix
        base_username = username
        counter = 1
        while get_user_by_username(username):
            username = f"{base_username}_{counter}"
            counter += 1
        
        # Check if email exists
        if get_user_by_email(email):
            return {'error': 'Email already registered with another account'}, 400
        
        user_data = {
            'username': username,
            'email': email,
            'name': name,
            'avatar_url': avatar_url,
            'created_at': datetime.utcnow(),
            'auth_provider': provider,
            'oauth': {
                provider: {
                    'id': str(provider_id),
                    'email': email,
                    'name': name,
                    'avatar_url': avatar_url
                }
            },
            'preferences': {
                'camera_emotion_detection': True,
                'voice_input': True,
                'wellness_reminders': True,
                'music_therapy': True,
                'daily_mood_tracking': True,
                'analytics_dashboard': True
            }
        }
        
        user_id = create_user(user_data)
        return user_id, 200
    except Exception as e:
        print(f"Error creating OAuth user: {e}")
        return None, 500

def login_oauth_user(provider, user_info):
    """Login user via OAuth provider"""
    try:
        provider_id = user_info.get('id')
        user_doc = get_oauth_user_by_provider_id(provider, provider_id)
        
        if not user_doc:
            # Create new user
            user_id, status = create_oauth_user(provider, user_info)
            if status != 200:
                return {'error': 'Failed to create user account'}, status
            user_doc = db.collection('users').document(user_id).get()
        
        # Set session
        session['user_id'] = user_doc.id
        session['username'] = user_doc.to_dict()['username']
        session['auth_provider'] = provider
        
        return {'message': 'Login successful', 'user_id': user_doc.id}, 200
    except Exception as e:
        print(f"Error in OAuth login: {e}")
        return {'error': 'OAuth login failed'}, 500

def generate_oauth_url(provider, redirect_uri):
    """Generate OAuth authorization URL"""
    if provider not in OAUTH_PROVIDERS:
        return None
    
    config = OAUTH_PROVIDERS[provider]
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    
    params = {
        'client_id': config['client_id'],
        'redirect_uri': redirect_uri,
        'scope': ' '.join(config['scopes']),
        'response_type': 'code',
        'state': state
    }
    
    if provider == 'google':
        params['access_type'] = 'offline'
        params['prompt'] = 'consent'
    
    query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    return f"{config['authorize_url']}?{query_string}"

def exchange_oauth_code(provider, code, redirect_uri):
    """Exchange OAuth code for access token and user info"""
    if provider not in OAUTH_PROVIDERS:
        return None, None
    
    config = OAUTH_PROVIDERS[provider]
    
    # Exchange code for token
    token_data = {
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'code': code,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code'
    }
    
    headers = {'Accept': 'application/json'}
    token_response = requests.post(config['token_url'], data=token_data, headers=headers)
    
    if token_response.status_code != 200:
        return None, None
    
    token_info = token_response.json()
    access_token = token_info.get('access_token')
    
    if not access_token:
        return None, None
    
    # Get user info
    user_headers = {'Authorization': f'Bearer {access_token}'}
    user_response = requests.get(config['userinfo_url'], headers=user_headers)
    
    if user_response.status_code != 200:
        return None, None
    
    return access_token, user_response.json()

def create_guest_user():
    """Create a temporary guest user"""
    try:
        guest_id = f"guest_{secrets.token_hex(8)}"
        user_data = {
            'username': guest_id,
            'email': f"{guest_id}@guest.local",
            'name': 'Guest User',
            'is_guest': True,
            'created_at': datetime.utcnow(),
            'auth_provider': 'guest',
            'preferences': {
                'camera_emotion_detection': True,
                'voice_input': True,
                'wellness_reminders': False,
                'music_therapy': True,
                'daily_mood_tracking': False,
                'analytics_dashboard': False
            }
        }
        
        user_id = create_user(user_data)
        
        # Set session
        session['user_id'] = user_id
        session['username'] = guest_id
        session['auth_provider'] = 'guest'
        session['is_guest'] = True
        
        return {'message': 'Guest session created', 'user_id': user_id}, 200
    except Exception as e:
        print(f"Error creating guest user: {e}")
        return {'error': 'Failed to create guest session'}, 500
