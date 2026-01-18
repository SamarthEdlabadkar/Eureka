import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import ConstraintSection from "./ConstraintSection";

interface ConstraintsViewProps {
  userPrompt: string;
  onBack: () => void;
}

// Mock constraint sections data
const CONSTRAINT_SECTIONS = [
  {
    code: "SEC_A",
    title: "Technical Architecture",
    points: [
      "Specify the primary database requirements: relational (PostgreSQL), document-based (MongoDB), or hybrid approach with caching layer.",
      "Define authentication requirements: OAuth providers needed, session management strategy, and role-based access control levels.",
      "Clarify API architecture preferences: REST endpoints, GraphQL schema, or real-time WebSocket connections for live updates.",
    ],
  },
  {
    code: "SEC_B",
    title: "User Experience Scope",
    points: [
      "List the core user personas and their primary workflows. Include frequency of use and critical task completion paths.",
      "Define responsive breakpoints priority: mobile-first, desktop-optimized, or progressive enhancement across all viewports.",
      "Specify accessibility requirements: WCAG compliance level, screen reader support, and keyboard navigation patterns.",
    ],
  },
  {
    code: "SEC_C",
    title: "Integration & Deployment",
    points: [
      "Identify third-party services required: payment processors, email providers, analytics platforms, or external API dependencies.",
      "Define deployment constraints: cloud provider preferences, containerization requirements, CI/CD pipeline specifications.",
      "Specify data compliance requirements: GDPR, HIPAA, SOC2, or regional data residency restrictions that apply.",
    ],
  },
];

const ConstraintsView = ({ userPrompt, onBack }: ConstraintsViewProps) => {
  const navigate = useNavigate();
  const [constraints, setConstraints] = useState("");
  const [completedPoints, setCompletedPoints] = useState<Set<string>>(new Set());

  // Calculate total number of points across all sections
  const totalPoints = CONSTRAINT_SECTIONS.reduce((sum, section) => sum + section.points.length, 0);
  const allPointsCompleted = completedPoints.size === totalPoints;

  const handleTogglePoint = (pointId: string) => {
    setCompletedPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pointId)) {
        newSet.delete(pointId);
      } else {
        newSet.add(pointId);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (constraints.trim()) {
      // For now, just log - would integrate with actual processing
      console.log("Submitted constraints:", constraints);
      alert("Constraints submitted! (Demo mode - no backend processing)");
    }
  };

  const handleGeneratePlan = () => {
    // Navigate to the plan view page
    navigate("/plan");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar - Source Prompt Display */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              ← BACK
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="flex-1 min-w-0">
              <div className="font-mono text-xs text-primary mb-1">
                SOURCE_PROMPT
              </div>
              <p className="text-truncate-display" title={userPrompt}>
                "{userPrompt}"
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Grid */}
      <main className="flex-1 container max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Refine Your Concept</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Review the following constraints and provide specific answers to build your technical plan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {CONSTRAINT_SECTIONS.map((section, index) => (
            <ConstraintSection
              key={section.code}
              code={section.code}
              title={section.title}
              points={section.points}
              sectionIndex={index}
              completedPoints={completedPoints}
              onTogglePoint={handleTogglePoint}
            />
          ))}
        </div>
      </main>

      {/* Bottom Bar - Sticky Input or Generate Plan Button */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          {allPointsCompleted ? (
            // Show "Generate Plan" button when all points are completed
            <div className="flex flex-col items-center gap-3">
              <Button
                variant="default"
                size="lg"
                onClick={handleGeneratePlan}
                className="px-12 py-6 text-lg bg-green-600 hover:bg-green-700"
              >
                Generate Plan
              </Button>
              <div className="font-mono text-xs text-muted-foreground">
                All constraints reviewed • Ready to generate implementation plan
              </div>
            </div>
          ) : (
            // Show input and submit button when not all points are completed
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="Enter your constraints and specific requirements here..."
                    className="input-industrial w-full h-12 px-4 rounded-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!constraints.trim()}
                >
                  Submit
                </Button>
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-2">
                Press Enter to submit • Be specific about technical requirements • {completedPoints.size}/{totalPoints} points reviewed
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ConstraintsView;
