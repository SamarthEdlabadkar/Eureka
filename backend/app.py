"""
Flask API for Eureka - Kicks off the refinement crew
"""

from datetime import datetime
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import instructor

from models import RefinementResult

# from refinement_crew.crew import RefinementCrew

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
                    "flaws": [
                        {"title": "Flaw Title", "description": "Flaw Description"},
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

        # TODO: Replace this placeholder prompt with the actual prompt
        prompt = f"""Act as a Strategic Product & Implementation Consultant with a background in failure analysis and venture capital due diligence. 
        Your goal is to conduct a rigorous "pre-mortem" on the user's idea: {topic}. 
        As a veteran systems thinker, you must look past the hype to identify critical vulnerabilities, execution gaps, and real-world friction points. 
        Provide a brutally honest yet insightful critique that exposes where the idea might break, specifically analyzing technical debt, market fit, regulatory hurdles, and human behavior. 
        Do not be mean, but be intellectually rigorous—your objective is to find the "hidden cracks" that others miss before they become fatal flaws."""

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
