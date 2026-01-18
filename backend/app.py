"""
Flask API for Eureka
"""

from datetime import datetime
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import instructor

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

        # Prompt for structured analysis with exactly 3 categories
        prompt = f"""Act as a Technical Systems Consultant and VC Strategist with a focus on failure analysis. 
        Your mission is to help me "pre-mortem" this idea: {topic}. 
        Instead of giving me a report, I want you to poke holes in it by asking me sharp, informal, and probing questions. 
        Focus heavily on the technical "how" and the logistical "why." 
        Think like a co-founder trying to find the hidden technical debt, scaling bottlenecks, and logistical nightmares before we write a single line of code. 
        Ask me about the messy stuff: edge cases in user behavior, hardware/software friction, supply chain or API dependencies, and how this breaks when we go from 1 to 1,000 users. 
        Keep it supportive and curious, but don't let me off the hook—force me to think through the unsexy, operational realities of making this work.
        
        IMPORTANT: You must provide exactly 3 categories, each with 2-3 critical questions that need to be answered."""

        # Call Groq with Instructor for structured output
        result = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # You can change this to other Groq models
            messages=[{"role": "user", "content": prompt}],
            response_model=RefinementResult,
            max_tokens=2000,
            temperature=0.7,
        )

        # Convert Pydantic model to dict for JSON response
        result_dict = result.model_dump()

        return jsonify({"success": True, "result": result_dict, "topic": topic}), 200

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


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    # Run the Flask development server
    app.run(host="0.0.0.0", port=5000, debug=True)
