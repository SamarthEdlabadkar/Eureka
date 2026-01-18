"""
Flask API for Eureka
"""

from datetime import datetime
import os

import tracing

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import instructor
from livekit import api

from models import RefinementResult
from agents import run_agents

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Eureka API is running"}), 200


@app.route("/api/refine", methods=["POST"])
def refine():
    """
    Kick off the refinement crew with user input using Groq + Instructor.

    Expected JSON payload:
    {
        "topic": "string - The topic to research and refine"
    }

    Returns:
    {
        "success": bool,
        "result": {
            "categories": [
                {
                    "name": "Category Name",
                    "questions": [
                        {"question": "Critical question to answer"},
                        ...
                    ]
                },
                ...
            ]
        },
        "error": "string - Error message if failed"
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        # Extract topic from request
        topic = data.get("topic")

        if not topic:
            return (
                jsonify({"success": False, "error": "Missing required field: topic"}),
                400,
            )

        # Initialize Groq client with Instructor
        groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        client = instructor.from_groq(groq_client)

        # Prompt aligned to Pydantic models in models.RefinementResult/Category/CriticalQuestion
        prompt = f"""
        You are a Technical Systems Consultant and VC Strategist with expertise in failure analysis and pre-mortems.

Your task is to analyze this idea and generate exactly 3 categories of critical questions:
"{topic}"

Generate EXACTLY 3 CATEGORIES. For each category:
1. Provide a concise category name (3-5 words)
2. List 2-3 critical questions for that category
3. Each question should be under 200 characters
4. Questions should probe deeply into technical feasibility, scaling challenges, logistical issues, and edge cases

Focus on:
- Technical "how" - architecture, dependencies, technology choices
- Logistical "why" - supply chain, operational challenges, resource constraints
- Scalability - what breaks when growing from 1 to 1,000 users
- Edge cases - user behavior exceptions, failure modes, hidden bottlenecks

Example format (for reference, not the actual output):
Category 1: "Technical Architecture"
- Question about core technical choices
- Question about scaling considerations

Category 2: "Operational Reality"  
- Question about operational challenges
- Question about resource allocation

Category 3: "Market & User Dynamics"
- Question about user behavior
- Question about market fit

Now generate the 3 categories for: {topic}
        """

        # Call Groq with Instructor for structured output
        # Pull model from environment (.env) with a sensible default
        groq_model = os.getenv(
            "GROQ_MODEL",
            "meta-llama/llama-4-scout-17b-16e-instruct",
        )

        result = client.chat.completions.create(
            model=groq_model,
            messages=[{"role": "user", "content": prompt}],
            response_model=RefinementResult,
            max_tokens=2500,
            temperature=0.3,
        )

        # Convert Pydantic model to dict for JSON response
        result_dict = result.model_dump()
        refined_result = {"categories": result_dict["categories"][:3]}

        return jsonify({"success": True, "result": refined_result, "topic": topic}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/agents/plan", methods=["POST"])
def run_planning_agents():
    """
    Run the LangGraph agents workflow for strategic planning.

    Expected JSON payload:
    {
        "topic": "string - The topic/domain for the project",
        "user_idea": "string - The user's initial idea",
        "constraints": "string - Any specific constraints (optional)"
    }

    Returns:
    {
        "success": bool,
        "result": {
            "master_prompt": "string - The structured master prompt from the Strategist",
            "strategic_roadmap": "string - The high-level roadmap from the Project Planner",
            "messages": [array of agent messages]
        },
        "error": "string - Error message if failed"
    }
    """
    try:
        # Get JSON data from request
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        # Extract required fields
        topic = data.get("topic")
        user_idea = data.get("user_idea")
        constraints = data.get("constraints", "")

        if not topic:
            return (
                jsonify({"success": False, "error": "Missing required field: topic"}),
                400,
            )

        if not user_idea:
            return (
                jsonify(
                    {"success": False, "error": "Missing required field: user_idea"}
                ),
                400,
            )

        # Run the agents workflow
        result = run_agents(topic, user_idea, constraints)

        return jsonify({"success": True, "result": result}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"success": False, "error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors"""
    return jsonify({"success": False, "error": "Method not allowed"}), 405


@app.route("/api/token", methods=["POST"])
def create_token():
    """
    Generate a LiveKit token for the frontend.
    """
    try:
        data = request.get_json()
        room_name = data.get("room_name", "default-room")
        participant_name = data.get("participant_name", "user")

        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")

        if not api_key or not api_secret:
            return jsonify({"error": "LiveKit credentials not configured"}), 500

        grant = api.VideoGrant(room_join=True, room=room_name)
        token = api.AccessToken(api_key, api_secret, grant=grant, identity=participant_name, name=participant_name)
        
        return jsonify({"token": token.to_jwt()}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    # Run the Flask development server
    app.run(host="0.0.0.0", port=5000, debug=True)
