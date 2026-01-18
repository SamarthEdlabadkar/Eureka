from phoenix.otel import register
from dotenv import load_dotenv
from openinference.instrumentation.langchain import LangChainInstrumentor
from openinference.instrumentation.groq import GroqInstrumentor

load_dotenv()

tracer_provider_groq = register(
    project_name="nexhacks-criticality",  # Default is 'default'
    auto_instrument=True,  # Auto-instrument your app based on installed OI dependencies
    set_global_tracer_provider=False,
)

GroqInstrumentor().instrument(tracer_provider=tracer_provider_groq)

# configure the Phoenix tracer
tracer_provider_refinement = register(
    project_name="nexhacks-refinement",  # Default is 'default'
    auto_instrument=True,  # Auto-instrument your app based on installed OI dependencies
    set_global_tracer_provider=False,
)

LangChainInstrumentor().instrument(tracer_provider=tracer_provider_refinement)
