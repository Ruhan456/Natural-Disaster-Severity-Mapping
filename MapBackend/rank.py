import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from fastai.vision.all import *
from werkzeug.security import generate_password_hash, check_password_hash

# MongoDB setup
uri = "mongodb+srv://aum:Sept2020@cluster0.jvtzn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))

# Flask setup
app = Flask(__name__)
CORS(app)

# MongoDB collections
db = client["user_list"]
collection = db["tasks"]
dis = db["disasters"]

# Load the machine learning model
learn = load_learner('earthquake_model.pkl')

# Add a new user with hashed password
def add_user(username, password):
    hashed_password = generate_password_hash(password)  # Hash the password
    user_data = {
        "username": username,
        "password": hashed_password  # Store hashed password
    }
    try:
        result = collection.insert_one(user_data)
        print(f"User added with ID: {result.inserted_id}")
    except Exception as e:
        print(f"Failed to insert user: {e}")

# Add a disaster
def add_dis(category, type, location):
    data = {
        "category": category,
        "type": type,
        "location": location
    }
    try:
        result = dis.insert_one(data)
        print(f"Disaster added with ID: {result.inserted_id}")
    except Exception as e:
        print(f"Failed to insert disaster: {e}")

# Routes
@app.route('/')
def index():
    return "Welcome to the API!"

@app.route('/api/data', methods=['POST'])
def add_user_route():
    data = request.get_json()
    un = data.get('username')
    ps = data.get('password')

    add_user(username=un, password=ps)
    return jsonify({"message": "User added successfully"}), 201

@app.route('/api/check', methods=['POST'])
def check_user():
    data = request.get_json()
    un = data.get('username')
    ps = data.get('password')

    user = collection.find_one({"username": un})

    if user:
        if check_password_hash(user["password"], ps):  # Verify hashed password
            return jsonify({"exists": True}), 200
        else:
            return jsonify({"exists": False, "message": "Incorrect password"}), 401
    else:
        return jsonify({"exists": False, "message": "Username not found"}), 404

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    type = request.form['disasterType']
    location = json.loads(request.form['location'])

    if not file.filename.endswith(('.jpg', '.jpeg')):
        return jsonify({'error': 'File must be a .jpg or .jpeg image'}), 400

    file_path = os.path.join('temp_image.jpg')
    file.save(file_path)

    try:
        predicted_class, _, probabilities = learn.predict(file_path)
        probabilities_list = probabilities.tolist()
        add_dis(str(predicted_class), type, location)
        return jsonify({
            'predicted_class': str(predicted_class),
            'probabilities': probabilities_list
        })
    finally:
        os.remove(file_path)

@app.route('/disasters', methods=['GET'])
def get_disasters():
    try:
        disasters = list(dis.find({}))
        for disaster in disasters:
            disaster['_id'] = str(disaster['_id'])
        return jsonify(disasters), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Main entry point
if __name__ == '__main__':
    app.run(debug=True)
