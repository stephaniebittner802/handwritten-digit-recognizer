from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import base64
import cv2
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Load the trained model
model = tf.keras.models.load_model("digit_model.h5")

def preprocess_image(image_data):
    content = image_data.split(";base64,")[1]
    img_bytes = base64.b64decode(content)
    image = Image.open(BytesIO(img_bytes)).convert("L")

    image = np.array(image).astype("uint8")
    image = 255 - image  # Invert: black background, white digit
    _, image = cv2.threshold(image, 50, 255, cv2.THRESH_BINARY)

    coords = cv2.findNonZero(image)
    if coords is None:
        image = np.zeros((28, 28), dtype=np.uint8)
    else:
        x, y, w, h = cv2.boundingRect(coords)
        image = image[y:y+h, x:x+w]

        # Resize to fit into 20x20
        h, w = image.shape
        if h > w:
            new_h = 20
            new_w = int((w / h) * 20)
        else:
            new_w = 20
            new_h = int((h / w) * 20)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

        # Pad to 28x28
        pad_top = (28 - new_h) // 2
        pad_bottom = 28 - new_h - pad_top
        pad_left = (28 - new_w) // 2
        pad_right = 28 - new_w - pad_left
        image = np.pad(image, ((pad_top, pad_bottom), (pad_left, pad_right)), 'constant', constant_values=0)

    # Normalize and reshape for prediction
    image = image.astype("float32") / 255.0
    return image.reshape(1, 28, 28, 1)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        processed = preprocess_image(data["image"])
        prediction = model.predict(processed)
        predicted_digit = int(np.argmax(prediction))
        return jsonify({"prediction": predicted_digit})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=False, use_reloader=False)