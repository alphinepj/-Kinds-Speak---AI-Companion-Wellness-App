from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from flask_wtf import CSRFProtect
import os
from dotenv import load_dotenv

# Import modules
from modules.database import db
from modules.auth import register_user, login_user, logout_user, require_auth, get_current_user, generate_oauth_url, exchange_oauth_code, login_oauth_user, create_guest_user
from modules.chat import initialize_gemini, process_chat_message, get_user_sessions, get_session_conversation, delete_chat_session
from modules.emotions import detect_image_emotions
from modules.profile import get_profile_page, update_profile, update_preferences, get_profile_statistics
from modules.wellness import start_meditation_session, complete_meditation_session, get_wellness_reminders, get_mindfulness_prompt

# Load environment variables
load_dotenv(dotenv_path='.env')
print(f"📁 Current working directory: {os.getcwd()}")
print(f"📄 .env file exists: {os.path.exists('.env')}")

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
csrf = CSRFProtect(app)

# Initialize Gemini AI
gemini_api_key = os.environ.get('GEMINI_API_KEY')
print(f"🔑 GEMINI_API_KEY loaded: {'Yes' if gemini_api_key else 'No'}")
model = initialize_gemini(gemini_api_key)

# Routes

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/register', methods=['GET', 'POST'])
@csrf.exempt
def register():
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        print(f"Registration attempt - Username: {username}, Email: {email}")
        
        result, status_code = register_user(username, email, password)
        return jsonify(result), status_code
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
@csrf.exempt
def login():
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        result, status_code = login_user(username, password)
        return jsonify(result), status_code
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    return logout_user()

# OAuth routes
@app.route('/auth/<provider>')
def oauth_login(provider):
    """Initiate OAuth login"""
    if provider not in ['google', 'github']:
        return jsonify({'error': 'Unsupported provider'}), 400
    
    redirect_uri = url_for('oauth_callback', provider=provider, _external=True)
    auth_url = generate_oauth_url(provider, redirect_uri)
    
    if not auth_url:
        return jsonify({'error': 'OAuth configuration error'}), 500
    
    return redirect(auth_url)

@app.route('/auth/<provider>/callback')
def oauth_callback(provider):
    """Handle OAuth callback"""
    if provider not in ['google', 'github']:
        return jsonify({'error': 'Unsupported provider'}), 400
    
    code = request.args.get('code')
    state = request.args.get('state')
    
    if not code or not state:
        flash('OAuth authentication failed', 'error')
        return redirect(url_for('login'))
    
    # Verify state
    if state != session.get('oauth_state'):
        flash('Invalid OAuth state', 'error')
        return redirect(url_for('login'))
    
    redirect_uri = url_for('oauth_callback', provider=provider, _external=True)
    access_token, user_info = exchange_oauth_code(provider, code, redirect_uri)
    
    if not access_token or not user_info:
        flash('Failed to get user information', 'error')
        return redirect(url_for('login'))
    
    result, status_code = login_oauth_user(provider, user_info)
    
    if status_code == 200:
        flash('Login successful!', 'success')
        return redirect(url_for('index'))
    else:
        flash(result.get('error', 'OAuth login failed'), 'error')
        return redirect(url_for('login'))

@app.route('/auth/guest', methods=['POST'])
@csrf.exempt
def guest_login():
    """Create guest session"""
    result, status_code = create_guest_user()
    return jsonify(result), status_code

# Chat routes
@app.route('/chat', methods=['POST'])
@csrf.exempt
@require_auth
def chat():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    message = data.get('message', '').strip()
    session_id = data.get('session_id')
    image_emotion = data.get('image_emotion')
    
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400
    
    result, status_code = process_chat_message(message, session_id, image_emotion, model)
    return jsonify(result), status_code

@app.route('/chat/sessions', methods=['GET', 'POST'])
@csrf.exempt
@require_auth
def chat_sessions():
    if request.method == 'GET':
        result, status_code = get_user_sessions()
        return jsonify(result), status_code
    
    # POST method for creating new session is handled in chat route
    return jsonify({"error": "Method not allowed"}), 405

@app.route('/chat/sessions/<session_id>/messages')
@require_auth
def get_session_messages(session_id):
    result, status_code = get_session_conversation(session_id)
    return jsonify(result), status_code

@app.route('/chat/sessions/<session_id>', methods=['DELETE'])
@csrf.exempt
@require_auth
def delete_session(session_id):
    result, status_code = delete_chat_session(session_id)
    return jsonify(result), status_code

# Emotion detection routes
@app.route('/emotions/analyze-image', methods=['POST'])
@csrf.exempt
@require_auth
def analyze_image_emotion():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400
        
        result = detect_image_emotions(data['image'])
        return jsonify(result)
    except Exception as e:
        print(f"Error in image emotion analysis: {e}")
        return jsonify({"error": "Failed to analyze image"}), 500

# Profile routes
@app.route('/profile')
@require_auth
def profile():
    return get_profile_page()

@app.route('/profile/update', methods=['POST'])
@csrf.exempt
@require_auth
def update_user_profile():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    result, status_code = update_profile(data)
    return jsonify(result), status_code

@app.route('/profile/preferences', methods=['POST'])
@csrf.exempt
@require_auth
def update_user_preferences():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    result, status_code = update_preferences(data)
    return jsonify(result), status_code

@app.route('/profile/stats')
@require_auth
def profile_stats():
    result, status_code = get_profile_statistics()
    return jsonify(result), status_code

# Wellness routes
@app.route('/meditation/start', methods=['POST'])
@csrf.exempt
@require_auth
def start_meditation():
    data = request.get_json()
    duration = data.get('duration', 5) if data else 5
    
    result, status_code = start_meditation_session(duration)
    return jsonify(result), status_code

@app.route('/meditation/complete/<session_id>', methods=['POST'])
@csrf.exempt
@require_auth
def complete_meditation(session_id):
    result, status_code = complete_meditation_session(session_id)
    return jsonify(result), status_code

@app.route('/wellness/reminders')
@require_auth
def wellness_reminders():
    result, status_code = get_wellness_reminders()
    return jsonify(result), status_code

@app.route('/wellness/mindfulness')
@require_auth
def mindfulness_prompt():
    result, status_code = get_mindfulness_prompt()
    return jsonify(result), status_code

@app.route('/terms')
def terms():
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")
    return render_template('terms.html', current_date=current_date)

@app.route('/privacy')
def privacy():
    from datetime import datetime
    current_date = datetime.now().strftime("%B %d, %Y")
    return render_template('privacy.html', current_date=current_date)

if __name__ == '__main__':
    app.run(debug=True, port=5001)
