import os
from dotenv import load_dotenv
from livekit import api

load_dotenv()

# Simple token server for testing
# In production, run this as a proper backend service

def create_token(room_name: str, participant_name: str) -> str:
    """
    Create a LiveKit access token for a participant
    """
    token = api.AccessToken(
        api_key=os.getenv('LIVEKIT_API_KEY'),
        api_secret=os.getenv('LIVEKIT_API_SECRET')
    )
    
    token.with_identity(participant_name).with_name(participant_name).with_grants(
        api.VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=True,
            can_subscribe=True,
        )
    )
    
    return token.to_jwt()

if __name__ == "__main__":
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    
    app = Flask(__name__)
    CORS(app)
    
    @app.route('/api/token', methods=['POST'])
    def get_token():
        data = request.json
        room_name = data.get('roomName', 'test-room')
        participant_name = data.get('participantName', 'user')
        
        try:
            token = create_token(room_name, participant_name)
            return jsonify({'token': token})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    print("🚀 Token server running on http://localhost:8080")
    print("💡 Open test_client.html in your browser to test")
    app.run(port=8080, debug=True)
