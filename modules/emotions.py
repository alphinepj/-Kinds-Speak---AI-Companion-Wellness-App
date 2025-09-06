"""
Emotion detection module for text and image analysis
"""
from transformers import pipeline
import torch
import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
import base64
import io

# Initialize Text Emotion Recognition Pipeline
try:
    emotion_classifier = pipeline(
        "text-classification",
        model="cardiffnlp/twitter-roberta-base-emotion-multilabel-latest",
        device=0 if torch.cuda.is_available() else -1
    )
    print("✅ Text emotion recognition model initialized successfully")
except Exception as e:
    emotion_classifier = None
    print(f"⚠️  Text emotion recognition model failed to load: {e}")

# Initialize Image Emotion Recognition Pipeline
try:
    image_emotion_classifier = pipeline(
        "image-classification",
        model="trpakov/vit-face-expression",
        device=0 if torch.cuda.is_available() else -1
    )
    print("✅ Image emotion recognition model initialized successfully")
except Exception as e:
    image_emotion_classifier = None
    print(f"⚠️  Image emotion recognition model failed to load: {e}")

# Initialize MediaPipe Face Detection
try:
    mp_face_detection = mp.solutions.face_detection
    mp_drawing = mp.solutions.drawing_utils
    face_detection = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)
    print("✅ MediaPipe face detection initialized successfully")
except Exception as e:
    face_detection = None
    print(f"⚠️  MediaPipe face detection failed to load: {e}")

def detect_emotions(text):
    """Detect emotions in text using Hugging Face model"""
    if not emotion_classifier or not text.strip():
        return {"emotions": [], "dominant_emotion": "neutral"}
    
    try:
        # Get emotion predictions
        results = emotion_classifier(text)
        
        # Process results - the model returns multiple labels with scores
        emotions = []
        for result in results:
            if result['score'] > 0.1:  # Only include emotions with confidence > 10%
                emotions.append({
                    "emotion": result['label'],
                    "confidence": round(result['score'], 3)
                })
        
        # Sort by confidence and get dominant emotion
        emotions.sort(key=lambda x: x['confidence'], reverse=True)
        dominant_emotion = emotions[0]['emotion'] if emotions else "neutral"
        
        return {
            "emotions": emotions,
            "dominant_emotion": dominant_emotion
        }
    except Exception as e:
        print(f"Error in emotion detection: {e}")
        return {"emotions": [], "dominant_emotion": "neutral"}

def detect_face_and_crop(image):
    """Detect face in image and return cropped face region"""
    if not face_detection:
        return image
    
    try:
        # Convert PIL image to RGB array
        image_rgb = np.array(image)
        
        # Detect faces
        results = face_detection.process(image_rgb)
        
        if results.detections:
            # Get the first detected face
            detection = results.detections[0]
            bboxC = detection.location_data.relative_bounding_box
            
            # Convert relative coordinates to absolute
            ih, iw, _ = image_rgb.shape
            x = int(bboxC.xmin * iw)
            y = int(bboxC.ymin * ih)
            w = int(bboxC.width * iw)
            h = int(bboxC.height * ih)
            
            # Add padding and ensure coordinates are within image bounds
            padding = 20
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(iw - x, w + 2 * padding)
            h = min(ih - y, h + 2 * padding)
            
            # Crop the face region
            face_region = image_rgb[y:y+h, x:x+w]
            return Image.fromarray(face_region)
        
        return image
    except Exception as e:
        print(f"Error in face detection: {e}")
        return image

def detect_image_emotions(image_data):
    """Detect emotions from image data"""
    if not image_emotion_classifier:
        return {"emotions": [], "dominant_emotion": "neutral", "confidence": 0.0}
    
    try:
        # Decode base64 image
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Detect and crop face
        face_image = detect_face_and_crop(image)
        
        # Analyze emotions
        results = image_emotion_classifier(face_image)
        
        # Process results
        emotions = []
        for result in results:
            emotions.append({
                "emotion": result['label'].lower(),
                "confidence": round(result['score'], 3)
            })
        
        # Sort by confidence
        emotions.sort(key=lambda x: x['confidence'], reverse=True)
        dominant_emotion = emotions[0]['emotion'] if emotions else "neutral"
        confidence = emotions[0]['confidence'] if emotions else 0.0
        
        return {
            "emotions": emotions,
            "dominant_emotion": dominant_emotion,
            "confidence": confidence
        }
    except Exception as e:
        print(f"Error in image emotion detection: {e}")
        return {"emotions": [], "dominant_emotion": "neutral", "confidence": 0.0}
