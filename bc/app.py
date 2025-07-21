from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
from PIL import Image
import io
import base64
import google.generativeai as genai
import os
from werkzeug.utils import secure_filename
import cv2

app = Flask(__name__)
CORS(app)

# Configure the Gemini API key
# Use environment variable or replace with your actual API key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyCr-vS21PrlF5e6oJ3tBSEaYc45zTk23RU")
genai.configure(api_key=GEMINI_API_KEY)

# Initialize the Gemini 1.5 Flash model
model = genai.GenerativeModel(model_name='gemini-1.5-flash')

# Load trained models
try:
    with open('best_model.pkl', 'rb') as f:
        classifier = pickle.load(f)
    with open('label_encoder.pkl', 'rb') as f:
        label_encoder = pickle.load(f)
    print("Models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")
    classifier = None
    label_encoder = None

def preprocess_image(image):
    """Preprocess image for model prediction"""
    try:
        # Convert PIL image to numpy array
        img_array = np.array(image)
        
        # Convert to RGB if RGBA
        if len(img_array.shape) == 3 and img_array.shape[2] == 4:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
        
        # Convert to grayscale if needed
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Resize to standard size (adjust based on your model requirements)
        img_resized = cv2.resize(img_array, (224, 224))
        
        # Normalize pixel values
        img_normalized = img_resized.astype('float32') / 255.0
        
        # Flatten for traditional ML models
        img_flattened = img_normalized.flatten().reshape(1, -1)
        
        return img_flattened
    except Exception as e:
        print(f"Error preprocessing image: {e}")
        return None

@app.route('/api/predict', methods=['POST'])
def predict_disease():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Check if models are loaded
        if classifier is None or label_encoder is None:
            return jsonify({'error': 'Models not loaded properly. Please ensure best_model.pkl and label_encoder.pkl are in the correct directory'}), 500
        
        # Read and process image
        try:
            image = Image.open(io.BytesIO(file.read()))
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
        except Exception as e:
            return jsonify({'error': f'Invalid image file: {str(e)}'}), 400
        
        processed_image = preprocess_image(image)
        
        if processed_image is None:
            return jsonify({'error': 'Error processing image'}), 400
        
        # Make prediction
        prediction_proba = classifier.predict_proba(processed_image)[0]
        prediction_class = classifier.predict(processed_image)[0]
        
        # Get all classes and their probabilities
        classes = label_encoder.classes_
        predictions = []
        
        for i, prob in enumerate(prediction_proba):
            predictions.append({
                'disease': classes[i],
                'confidence': float(prob * 100)
            })
        
        # Sort by confidence
        predictions.sort(key=lambda x: x['confidence'], reverse=True)
        
        # Get top prediction
        top_prediction = label_encoder.inverse_transform([prediction_class])[0]
        top_confidence = float(max(prediction_proba) * 100)
        
        return jsonify({
            'success': True,
            'top_prediction': {
                'disease': top_prediction,
                'confidence': top_confidence
            },
            'all_predictions': predictions[:5]  # Top 5 predictions
        })
        
    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def medical_chatbot():
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
        
        user_message = data['message']
        diagnosis_context = data.get('diagnosis', '')
        
        # Create medical context prompt
        medical_prompt = f"""
        You are a medical AI assistant. Please provide helpful, accurate medical information while emphasizing that this is for educational purposes only and users should consult healthcare professionals for medical advice.
        
        {f"Context: The user has received a diagnosis prediction of '{diagnosis_context}'" if diagnosis_context else ""}
        
        User question: {user_message}
        
        Please provide a clear, informative response about medical conditions, symptoms, treatments, or general health information. Always remind users to consult with healthcare professionals for personalized medical advice.
        in a correct text format and minimul content within 1 line for irrelavent message.
        """
        
        # Check if Gemini API key is configured
        if GEMINI_API_KEY == "YOUR_ACTUAL_GEMINI_API_KEY_HERE" or not GEMINI_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Gemini API key not configured. Please set your GEMINI_API_KEY environment variable.'
            }), 500
        
        # Generate response using Gemini
        response = model.generate_content(medical_prompt)
        
        return jsonify({
            'success': True,
            'response': response.text
        })
        
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': f'Chat service unavailable: {str(e)}'}), 500

@app.route('/api/generate-report', methods=['POST'])
def generate_medical_report():
    try:
        data = request.get_json()
        
        if not data or 'diagnosis' not in data:
            return jsonify({'error': 'No diagnosis provided'}), 400
        
        diagnosis = data['diagnosis']
        confidence = data.get('confidence', 0)
        
        report_prompt = f"""
        Generate a detailed medical report for the following diagnosis:
        
        Diagnosis: {diagnosis}
        Confidence Level: {confidence}%
        
        Please include:
        1. Overview of the condition
        2. Common symptoms and characteristics
        3. Possible causes and risk factors
        4. Recommended next steps and treatments
        5. Important disclaimers about AI diagnosis limitations
        
        Format this as a professional medical report while emphasizing that this is AI-generated and should not replace professional medical consultation.
        """
        
        # Check if Gemini API key is configured
        if GEMINI_API_KEY == "YOUR_ACTUAL_GEMINI_API_KEY_HERE" or not GEMINI_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Gemini API key not configured. Please set your GEMINI_API_KEY environment variable.'
            }), 500
        
        response = model.generate_content(report_prompt)
        
        return jsonify({
            'success': True,
            'report': response.text
        })
        
    except Exception as e:
        print(f"Report generation error: {e}")
        return jsonify({'error': f'Report generation failed: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    gemini_configured = GEMINI_API_KEY and GEMINI_API_KEY != "YOUR_ACTUAL_GEMINI_API_KEY_HERE"
    
    return jsonify({
        'status': 'healthy',
        'models_loaded': classifier is not None and label_encoder is not None,
        'gemini_configured': gemini_configured,
        'message': 'MedAI Diagnostics API is running'
    })

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create uploads directory if it doesn't exist
    os.makedirs('uploads', exist_ok=True)
    
    print("Starting Medical Image Analysis Server...")
    print("Make sure to:")
    print("1. Set your Gemini API key as environment variable: export GEMINI_API_KEY=your_key_here")
    print("   Or replace 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' in the code")
    print("2. Place 'best_model.pkl' and 'label_encoder.pkl' in the same directory")
    print("3. Install required packages:")
    print("   pip install flask flask-cors pillow google-generativeai opencv-python numpy")
    
    app.run(debug=True, host='0.0.0.0', port=5000)