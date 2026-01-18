from phoenix.otel import register
from dotenv import load_dotenv

load_dotenv()

tracer_provider_groq = register(
    project_name="nexhacks-criticality",  # Default is 'default'
    auto_instrument=True,  # Auto-instrument your app based on installed OI dependencies
)

# configure the Phoenix tracer
tracer_provider_refinement = register(
    project_name="nexhacks-refinement",  # Default is 'default'
    auto_instrument=True,  # Auto-instrument your app based on installed OI dependencies
)
