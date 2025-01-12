from flask import Flask, request, jsonify
from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image
import cohere
import base64
import io


# Initialize Flask app
app = Flask(__name__)

# Initialize Cohere client
co = cohere.Client('UNvhP1xe0Phy13S4Ry4xHPOv77KfueKo8AWlmEfU')

# Initialize Hugging Face BLIP model
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'  # Allow requests from any domain
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'  # Allow POST and OPTIONS methods
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'  # Allow Content-Type header
    return response

# Define your route
@app.route('/generate-description', methods=['POST', 'OPTIONS'])
def generate_description():
    # Handle the CORS preflight request (OPTIONS)
    if request.method == 'OPTIONS':
        # Add CORS headers
        response = app.response_class()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    # Handle the POST request
    try:
        data = request.get_json()
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        # Decode the base64-encoded image
        image_data = base64.b64decode(data['image'].split(",")[1])  # Remove 'data:image/png;base64,' part
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Generate a caption using BLIP
        inputs = processor(image, return_tensors="pt")
        outputs = model.generate(**inputs)
        description = processor.decode(outputs[0], skip_special_tokens=True)

        return jsonify({'description': description})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)