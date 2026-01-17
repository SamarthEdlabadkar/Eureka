import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const PlanView = () => {
  const navigate = useNavigate();
  const [markdownContent, setMarkdownContent] = useState("");

  useEffect(() => {
    // Fetch the markdown file
    fetch("/sample-plan.md")
      .then((response) => response.text())
      .then((text) => setMarkdownContent(text))
      .catch((error) => console.error("Error loading markdown:", error));
  }, []);

  const handleAcceptPlan = () => {
    alert("Plan accepted! Moving to implementation phase...");
    // TODO: Navigate to next phase or trigger backend action
  };

  const handleSuggestChanges = () => {
    alert("Opening feedback form...");
    // TODO: Open a dialog or navigate to feedback page
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Generated Implementation Plan</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                Review the technical specifications and architecture
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ← BACK TO START
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Markdown Rendering */}
      <main className="flex-1 container max-w-5xl mx-auto px-6 py-8">
        <div className="card-industrial p-8 mb-24">
          <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h3:text-xl prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </article>
        </div>
      </main>

      {/* Bottom Action Buttons */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="container max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleSuggestChanges}
              className="px-8"
            >
              Suggest Changes
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleAcceptPlan}
              className="px-8 bg-green-600 hover:bg-green-700"
            >
              Accept Plan
            </Button>
          </div>
          <div className="font-mono text-xs text-muted-foreground text-center mt-3">
            Review the plan carefully before accepting
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlanView;
