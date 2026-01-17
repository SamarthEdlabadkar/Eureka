"""
Flask API for Eureka - Kicks off the refinement crew
"""

from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS

from refinement_crew.crew import RefinementCrew

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "Eureka API is running"}), 200


@app.route("/api/refine", methods=["POST"])
def refine():
    """
    Kick off the refinement crew with user input.

    Expected JSON payload:
    {
        "topic": "string - The topic to research and refine"
    }

    Returns:
    {
        "success": bool,
        "result": "string - The crew's output",
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

        # Prepare inputs for the crew
        inputs = {"topic": topic, "current_year": str(datetime.now().year)}

        # Kick off the refinement crew
        crew_instance = RefinementCrew()
        result = crew_instance.crew().kickoff(inputs=inputs)

        return jsonify({"success": True, "result": str(result), "topic": topic}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/refine/async", methods=["POST"])
def refine_async():
    """
    Kick off the refinement crew asynchronously.

    Expected JSON payload:
    {
        "topic": "string - The topic to research and refine"
    }

    Returns immediately with a confirmation that the job has started.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "error": "No JSON data provided"}), 400

        topic = data.get("topic")

        if not topic:
            return (
                jsonify({"success": False, "error": "Missing required field: topic"}),
                400,
            )

        inputs = {"topic": topic, "current_year": str(datetime.now().year)}

        # Kick off the crew asynchronously
        crew_instance = RefinementCrew()
        _ = crew_instance.crew().kickoff_async(inputs=inputs)

        return (
            jsonify(
                {
                    "success": True,
                    "message": f"Refinement crew started for topic: {topic}",
                    "topic": topic,
                }
            ),
            202,
        )

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
