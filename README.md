# 🌿 Kinds Speak - AI Companion & Wellness App

A comprehensive Flask-based companion app featuring advanced AI integration, **real-time emotion detection**, wellness tracking, and mindfulness features. Built with Google Gemini AI, Firebase backend, and cutting-edge emotion recognition technology.

> **🚀 Latest Update**: Complete modern UI redesign with Bootstrap 5 + Tailwind CSS, real-time camera emotion detection, and streamlined codebase.

## ✨ Key Features

### 🤖 **Intelligent AI Companion**
- **Gemini AI Integration**: Advanced conversational AI with contextual understanding
- **Emotion-Aware Responses**: AI adapts responses based on detected emotions
- **Chat Session Management**: ChatGPT-like conversation history and session switching
- **Real-time Processing**: Instant responses with typing indicators

### 😊 **Advanced Emotion Detection**
- **Real-Time Camera Analysis**: Automatic emotion detection every 3 seconds from live video feed
- **Text Emotion Analysis**: Real-time sentiment analysis using Hugging Face models
- **Facial Expression Recognition**: MediaPipe-powered face detection with emotion classification
- **Multimodal Integration**: Combines text and facial emotions for enhanced AI responses
- **Visual Feedback**: Live emotion display with confidence scores and pulsing indicators

### 🎥 **Camera & Voice Features**
- **Live Camera Feed**: Real-time video emotion analysis every 3 seconds
- **Face Detection**: MediaPipe-powered accurate face recognition
- **Voice Input**: Speech-to-text for hands-free interaction
- **Privacy Controls**: Easy camera on/off toggle

### 🧘 **Wellness & Mindfulness**
- **Meditation Sessions**: Guided meditation with customizable duration
- **Wellness Reminders**: Personalized health and mindfulness prompts
- **Mood Tracking**: Daily mood, energy, and stress level monitoring
- **Analytics Dashboard**: Comprehensive wellness metrics and trends

### 👤 **Advanced Profile Management**
- **Real-time Statistics**: Live chat count, meditation sessions, wellness scores
- **Activity Timeline**: Complete history of conversations and wellness activities
- **Preference Controls**: Customizable feature toggles and settings
- **Achievement System**: Wellness milestones and progress tracking

### 🎨 **Modern User Experience**
- **Bootstrap 5 + Tailwind CSS**: Modern, responsive design framework
- **Glassmorphism UI**: Backdrop blur effects with gradient overlays
- **Real-Time Animations**: Smooth transitions, hover effects, and micro-interactions
- **Mobile-First Design**: Fully responsive across all devices
- **Clean Architecture**: Streamlined codebase with modular components

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd kinds_speak
pip3 install -r requirements.txt
```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
SECRET_KEY=your-flask-secret-key-here
GEMINI_API_KEY=your-google-gemini-api-key-here
```

### 3. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Firestore Database** in production mode
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate new private key**
5. Save the downloaded file as `serviceAccountKey.json` in project root

### 4. Launch Application

```bash
python3 app.py
```

🌐 **Access your app at:** `http://localhost:5001`

> **Note**: The app runs on port 5001 by default. If port is in use, kill existing processes with `lsof -ti:5001 | xargs kill -9`

### 5. First Time Experience

1. **Register**: Visit `/register` to create your account
2. **Login**: Sign in with your credentials
3. **Enable Camera**: Allow camera access for emotion detection
4. **Start Chatting**: Begin conversations with your AI companion
5. **Explore Features**: Try meditation, wellness reminders, and profile customization

## 📁 Project Architecture

```
kinds_speak/
├── app.py                    # Main Flask application with routing
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create from .env.example)
├── .env.example              # Environment variables template
├── serviceAccountKey.json    # Firebase service account key
├── OAUTH_SETUP.md           # OAuth configuration guide
├── modules/                  # Modular backend components
│   ├── __init__.py          # Package initialization
│   ├── database.py          # Firebase Firestore connection & utilities
│   ├── auth.py              # User authentication & OAuth integration
│   ├── chat.py              # AI chat & conversation management
│   ├── emotions.py          # Text & image emotion detection
│   ├── profile.py           # User profile & statistics management
│   └── wellness.py          # Meditation & wellness features
├── templates/               # Modern HTML templates
│   ├── base.html            # Base template with modern CSS/JS
│   ├── dashboard.html       # Main dashboard with real-time features
│   ├── login.html           # Modern authentication page
│   └── register.html        # Modern registration page
├── static/                  # Frontend assets
│   ├── css/
│   │   └── modern.css       # Bootstrap 5 + Tailwind CSS framework
│   └── js/
│       ├── auth.js          # Authentication handling
│       ├── dashboard.js     # Dashboard & real-time emotion detection
│       └── modals.js        # Modal components
└── README.md               # Project documentation
```

## 🔧 Technical Architecture

### 🤖 AI & Machine Learning
- **Google Gemini AI**: Advanced conversational AI using Gemini 1.5 Flash model
- **Text Emotion Analysis**: `cardiffnlp/twitter-roberta-base-emotion-multilabel-latest` model
- **Image Emotion Recognition**: `trpakov/vit-face-expression` model with MediaPipe face detection
- **Real-Time Processing**: Automatic emotion detection every 3 seconds from live camera feed
- **Multimodal Integration**: Combines text sentiment and facial expressions for enhanced AI responses
- **Background Analysis**: Non-blocking emotion processing with visual feedback indicators

### 💬 Chat System
- **Session Management**: ChatGPT-like conversation history with session switching
- **Emotion-Aware Responses**: AI adapts based on detected user emotions
- **Real-time Interface**: WebSocket-like experience with instant message delivery
- **Conversation Storage**: Complete chat history with emotion metadata
- **Fallback System**: Keyword-based responses when AI is unavailable

### 📊 Database & Storage
- **Firebase Firestore**: NoSQL cloud database for scalability and real-time sync
- **Collections Structure**:
  - `users`: User profiles, preferences, and authentication data
  - `conversations`: Chat messages with emotion analysis results
  - `chat_sessions`: Session metadata and conversation grouping
  - `meditation_sessions`: Wellness tracking and meditation history
- **Real-time Updates**: Live synchronization across all components

### 🎥 Media Processing
- **Real-Time Camera**: WebRTC-based video capture with automatic emotion analysis
- **Face Detection**: MediaPipe for accurate facial landmark detection and cropping
- **Image Processing**: Optimized frame analysis with OpenCV and PIL
- **Background Processing**: Non-blocking emotion detection every 3 seconds
- **Privacy Controls**: Local processing with easy camera toggle controls

## 🔑 API Configuration

### Google Gemini AI Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key** 
4. Copy the generated key
5. Add to `.env`: `GEMINI_API_KEY=your_api_key_here`

### Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create a project** or select existing project
3. Enable **Firestore Database** in production mode
4. Navigate to **Project Settings** > **Service Accounts**
5. Click **Generate new private key**
6. Download and rename file to `serviceAccountKey.json`
7. Place in project root directory

## 🛠️ API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User authentication  
- `GET /logout` - Session termination

### Chat & Conversations
- `POST /chat` - Send message and get AI response
- `GET /chat/sessions` - Retrieve user's chat sessions
- `GET /chat/sessions/<id>/messages` - Get messages for specific session
- `DELETE /chat/sessions/<id>` - Delete chat session

### Emotion Detection
- `POST /emotions/analyze-image` - Analyze facial emotions from camera feed

### Profile Management
- `GET /profile` - User profile page
- `POST /profile/update` - Update user information
- `POST /profile/preferences` - Update user preferences
- `GET /profile/stats` - Get user statistics

### Wellness Features
- `POST /meditation/start` - Begin meditation session
- `POST /meditation/complete/<id>` - Complete meditation session
- `GET /wellness/reminders` - Get personalized wellness tips
- `GET /wellness/mindfulness` - Get mindfulness exercise prompts

## ⚙️ Customization

### Modifying AI Personality
Edit the AI prompt in `modules/chat.py`:

```python
prompt = f"""You are a calm, supportive AI companion focused on mindfulness and well-being.
{emotion_context}
Respond to the user's message in a helpful, empathetic way. Keep responses concise and encouraging.

User message: {message}"""
```

### Adding New Wellness Features
1. Create new functions in `modules/wellness.py`
2. Add corresponding routes in `app.py`
3. Update frontend templates as needed
4. Extend Firebase collections if required

### Customizing Emotion Detection
- **Text Models**: Replace model in `modules/emotions.py` line 16
- **Image Models**: Update model in `modules/emotions.py` line 27
- **Detection Frequency**: Modify interval in `templates/dashboard.html` line 822

## 🔒 Security & Production

### Security Features
- **CSRF Protection**: Flask-WTF tokens on all forms
- **Password Security**: Werkzeug hashing with salt
- **Session Management**: Secure Flask sessions
- **Input Validation**: Server-side data sanitization
- **Environment Isolation**: Sensitive data in `.env` files

### Production Deployment
- Set strong `SECRET_KEY` (32+ random characters)
- Configure Firebase Security Rules
- Implement rate limiting (Flask-Limiter)
- Enable HTTPS with SSL certificates
- Add input validation and sanitization
- Set up monitoring and logging
- Use production WSGI server (Gunicorn)

## 📦 Dependencies

### Core Framework
- **Flask 2.3.3**: Web application framework
- **Firebase Admin 6.2.0**: Backend database integration
- **Flask-WTF 1.1.1**: CSRF protection and form handling

### AI & Machine Learning
- **google-generativeai 0.3.2**: Gemini AI integration
- **transformers 4.36.0**: Hugging Face model pipeline
- **torch 2.4.1**: PyTorch for ML model execution

### Computer Vision & Media
- **opencv-python 4.8.1.78**: Image processing and camera handling
- **mediapipe 0.10.21**: Face detection and landmark recognition
- **Pillow 10.0.1**: Image manipulation and format conversion

### Utilities
- **python-dotenv 1.0.0**: Environment variable management
- **requests 2.31.0**: HTTP client for API calls

## 🐛 Troubleshooting

### Installation Issues
```bash
# Fix MediaPipe version conflicts
pip3 uninstall mediapipe
pip3 install mediapipe==0.10.21

# Clear pip cache if needed
pip3 cache purge
```

### Runtime Issues
```bash
# Port already in use
lsof -ti:5001 | xargs kill -9

# Permission denied for camera
# Grant camera permissions in browser settings

# Firebase connection errors
# Verify serviceAccountKey.json exists and is valid JSON
```

### Common Error Solutions
1. **ModuleNotFoundError**: Run `pip3 install -r requirements.txt`
2. **Gemini API errors**: Check API key in `.env` file
3. **Camera not working**: Enable camera permissions in browser
4. **Emotion models not loading**: Ensure stable internet for model downloads
5. **Firebase errors**: Verify service account key and Firestore rules

### Debug Mode
Enable detailed logging by setting `debug=True` in `app.py`. Check browser console for JavaScript errors and terminal for Python exceptions.

## 🎯 Performance Optimization

- **Model Caching**: Emotion models cached after first load
- **Image Processing**: Optimized frame analysis with 3-second intervals
- **Database Queries**: Efficient Firestore queries with proper indexing
- **Frontend**: Debounced API calls and lazy loading
- **Memory Management**: Automatic cleanup of video streams

## 📄 License

This project is a prototype for educational and research purposes. Feel free to use, modify, and distribute under MIT License terms.

---

**Built with ❤️ using Flask, Firebase, and cutting-edge AI technology**

