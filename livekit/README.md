# LiveKit Voice Agent - Quick Start Guide

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
pip install -r requirements.txt
pip install flask flask-cors
```

### 2. Verify Environment Variables
Check that your `.env` file contains:
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `GROQ_API_KEY`

## 🎯 Running the Agent

### Option 1: Development Mode (Recommended for Testing)
```bash
python agent.py dev
```

This starts the agent in development mode with a local connection.

### Option 2: Production Mode
```bash
python agent.py start
```

## 🧪 Testing the Agent

### Method 1: Using the Test Client (Easiest)

1. **Start the agent:**
   ```bash
   python agent.py dev
   ```

2. **Start the token server** (in a new terminal):
   ```bash
   python token_server.py
   ```

3. **Open the test client:**
   - Open `test_client.html` in your browser
   - Enter a room name (e.g., "test-room")
   - Click "Connect to Room"
   - Allow microphone access
   - Start speaking!

### Method 2: Using LiveKit Playground

1. Start your agent:
   ```bash
   python agent.py dev
   ```

2. Go to your LiveKit Cloud dashboard:
   - https://cloud.livekit.io/

3. Navigate to "Agents" section

4. Create a test room and join it

5. The agent will automatically connect and process your voice

### Method 3: Using LiveKit CLI

```bash
# Install LiveKit CLI
npm install -g livekit-cli

# Create a test room
livekit-cli create-room --url $LIVEKIT_URL --api-key $LIVEKIT_API_KEY --api-secret $LIVEKIT_API_SECRET test-room

# Join the room (opens a browser)
livekit-cli join-room --url $LIVEKIT_URL --api-key $LIVEKIT_API_KEY --api-secret $LIVEKIT_API_SECRET test-room
```

## 🔍 What the Agent Does

1. **Listens** to your voice via STT (Speech-to-Text) using Groq Whisper
2. **Processes** the text through Groq LLM (llama-3.3-70b-versatile)
3. **Refines** the text to be professional and concise
4. **Returns** the refined text as a chat message

## 📊 Monitoring

Watch the agent logs for:
- Connection status
- Audio processing
- Refined text output
- Any errors

## 🛠️ Troubleshooting

### Agent won't start
- Check that all environment variables are set
- Verify your API keys are valid
- Ensure no other process is using the same port

### No audio processing
- Check microphone permissions in browser
- Verify the agent is connected to the room
- Check LiveKit Cloud dashboard for room status

### Token errors
- Verify your LIVEKIT_API_KEY and LIVEKIT_API_SECRET
- Check that the token server is running (if using test client)
- Ensure your LiveKit cloud project is active

## 💡 Tips

- Use headphones to avoid echo/feedback
- Speak clearly and at a normal pace
- Check the browser console for detailed logs
- Monitor the agent terminal for processing logs

## 🔗 Useful Links

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Agents Guide](https://docs.livekit.io/agents/)
- [Groq API Docs](https://console.groq.com/docs)
