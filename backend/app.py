"""
Flask API for Eureka
"""

from datetime import datetime
import os
import json

import tracing

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
import instructor
from livekit import api

from models import RefinementResult
from refinement_agents import run_agents
from phase_ii_agents import run_phase2_workflow

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


@app.route("/api/agents/phase-ii", methods=["POST"])
def run_phase_ii_agents():
    """
    Run the Phase II LangGraph agents workflow for detailed project analysis.

    This endpoint executes three agents in parallel/sequential order:
    1. Task Breakdown Agent (WBS) - Decomposes project into Work Breakdown Structure
    2. Technical Requirements Agent (TRD) - Generates Technical Requirements Document
    3. Critical Path Agent (CPM) - Performs Critical Path Method analysis

    Expected JSON payload:
    {
        "project_description": "string - The project description or idea to analyze",
        "strategic_plan": "object - (optional) The strategic plan output from Phase I agents"
    }

    Returns:
    {
        "success": bool,
        "result": {
            "task_breakdown": {
                "tasks": [array of task names],
                "total_tasks": number,
                "dependencies": {task: [prerequisite tasks]},
                "wbs_structure": {raw LLM output with hierarchical breakdown}
            },
            "technical_requirements": {
                "article": "string - Full TRD document",
                "sections": [array of section names],
                "word_count": number,
                "trd_structure": {detailed tech stack and API specs}
            },
            "critical_path": {
                "critical_path": [array of task IDs in critical path],
                "total_duration": number (days),
                "critical_tasks": [array of critical task IDs],
                "resource_allocation": {track: {roles and counts}},
                "cpm_structure": {
                    "tasks": [array of task objects with id, title, criticality, track, duration, dependencies],
                    "tracks": [array of parallel tracks],
                    "total_duration": number
                }
            },
            "errors": [array of any errors that occurred]
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
        project_description = data.get("project_description")
        strategic_plan = data.get("strategic_plan", "")

        if not project_description:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Missing required field: project_description",
                    }
                ),
                400,
            )

        # Run the Phase II agents workflow
        workflow_result = run_phase2_workflow(project_description)

        # Extract structured outputs from workflow result
        result = {
            "task_breakdown": None,
            "technical_requirements": None,
            "critical_path": None,
            "errors": workflow_result.get("errors", []),
        }

        # Parse task breakdown output
        if workflow_result.get("task_breakdown"):
            task_output = workflow_result["task_breakdown"]
            result["task_breakdown"] = {
                "tasks": task_output.tasks,
                "total_tasks": task_output.total_tasks,
                "dependencies": task_output.dependencies,
                "wbs_structure": workflow_result.get("wbs_structure", {}),
            }

        # Parse technical requirements (TRD) output
        if workflow_result.get("article"):
            article_output = workflow_result["article"]
            result["technical_requirements"] = {
                "article": article_output.article,
                "sections": article_output.sections,
                "word_count": article_output.word_count,
                "trd_structure": workflow_result.get("trd_structure", {}),
            }

        # Parse critical path output
        if workflow_result.get("critical_path"):
            cpm_output = workflow_result["critical_path"]
            cpm_structure = workflow_result.get("cpm_structure", {})

            # Ensure cpm_structure is properly serialized as JSON
            if isinstance(cpm_structure, dict):
                # Make sure all nested objects are JSON serializable
                cpm_structure_json = {
                    "tasks": cpm_structure.get("tasks", []),
                    "tracks": cpm_structure.get("tracks", []),
                    "critical_path": cpm_structure.get("critical_path", []),
                    "total_duration": cpm_structure.get("total_duration", 0),
                    "resource_allocation": cpm_structure.get("resource_allocation", {}),
                }
            else:
                cpm_structure_json = {}

            result["critical_path"] = {
                "critical_path": cpm_output.critical_path,
                "total_duration": cpm_output.total_duration,
                "critical_tasks": cpm_output.critical_tasks,
                "resource_allocation": cpm_output.resource_allocation,
                "cpm_structure": cpm_structure_json,
            }

        return jsonify({"success": True, "result": result}), 200

    except Exception as e:
        import traceback

        error_trace = traceback.format_exc()
        return jsonify({"success": False, "error": str(e), "trace": error_trace}), 500


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


@app.route("/api/livekit-token", methods=["POST"])
def get_livekit_token():
    """
    Generate LiveKit access token for frontend connection

    Expected JSON payload:
    {
        "roomName": "string - Room to join",
        "identity": "string - User identity"
    }

    Returns:
    {
        "token": "string - JWT token",
        "url": "string - LiveKit server URL"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        room_name = data.get("roomName")
        identity = data.get("identity")

        if not room_name or not identity:
            return jsonify({"error": "Missing roomName or identity"}), 400

        # Get LiveKit credentials from environment
        api_key = os.getenv("LIVEKIT_API_KEY")
        api_secret = os.getenv("LIVEKIT_API_SECRET")
        livekit_url = os.getenv(
            "LIVEKIT_URL", ""
        )

        if not api_key or not api_secret:
            return jsonify({"error": "LiveKit credentials not configured"}), 500

        # Create access token
        token = api.AccessToken(api_key, api_secret)
        token.with_identity(identity).with_name(identity).with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )

        jwt_token = token.to_jwt()

        return jsonify({"token": jwt_token, "url": livekit_url}), 200

    except Exception as e:
        print(f"Error generating LiveKit token: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Run the Flask development server
    app.run(host="0.0.0.0", port=5000, debug=True)
