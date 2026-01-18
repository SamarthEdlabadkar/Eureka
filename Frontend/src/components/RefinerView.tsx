import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import HomeButton from "@/components/HomeButton";
import VoiceMicButton from "@/components/VoiceMicButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { X, RotateCcw } from "lucide-react";

type CriticalQuestion = { question: string };
type Category = { name: string; questions: CriticalQuestion[] };
type RefinementResult = { categories: Category[] };

interface RefinerViewProps {
  userPrompt: string;
  refineResult: RefinementResult | null;
  onHome: () => void;
  onGeneratePlan: (planData: any) => void;
}

interface ConstraintPoint {
  id: string;
  text: string;
  reviewed: boolean;
  dismissed: boolean;
}

interface Section {
  id: string;
  title: string;
  code: string;
  points: ConstraintPoint[];
}

const initialSections: Section[] = [
  {
    id: "a",
    title: "Technical Architecture",
    code: "SEC_A",
    points: [
      {
        id: "a1",
        text: "Specify the primary database requirements: relational (PostgreSQL), document-based (MongoDB), or hybrid approach with caching layer.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "a2",
        text: "Define authentication requirements: OAuth providers needed, session management strategy, and role-based access control levels.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "a3",
        text: "Clarify API architecture preferences: REST endpoints, GraphQL schema, or real-time WebSocket connections for live updates.",
        reviewed: false,
        dismissed: false,
      },
    ],
  },
  {
    id: "b",
    title: "User Experience Scope",
    code: "SEC_B",
    points: [
      {
        id: "b1",
        text: "List the core user personas and their primary workflows. Include frequency of use and critical task completion paths.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "b2",
        text: "Define responsive breakpoints priority: mobile-first, desktop-optimized, or progressive enhancement across all viewports.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "b3",
        text: "Specify accessibility requirements: WCAG compliance level, screen reader support, and keyboard navigation patterns.",
        reviewed: false,
        dismissed: false,
      },
    ],
  },
  {
    id: "c",
    title: "Integration & Deployment",
    code: "SEC_C",
    points: [
      {
        id: "c1",
        text: "Identify third-party services required: payment processors, email providers, analytics platforms, or external API dependencies.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "c2",
        text: "Define deployment constraints: cloud provider preferences, containerization requirements, CI/CD pipeline specifications.",
        reviewed: false,
        dismissed: false,
      },
      {
        id: "c3",
        text: "Specify data compliance requirements: GDPR, HIPAA, SOC2, or regional data residency restrictions that apply.",
        reviewed: false,
        dismissed: false,
      },
    ],
  },
];

const RefinerView = ({ userPrompt, refineResult, onHome, onGeneratePlan }: RefinerViewProps) => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [constraints, setConstraints] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    isListening,
    status,
    transcription,
    audioLevels,
    toggleListening,
    stopListening
  } = useVoiceInput({
    simulatedText: "PostgreSQL with Redis caching, OAuth2 with Google and GitHub...",
    onTranscriptionComplete: (text) => {
      setConstraints(text);
    }
  });

  // Sync transcription to input as it types
  useEffect(() => {
    if (transcription && isListening) {
      setConstraints(transcription);
    }
  }, [transcription, isListening]);

  // When refineResult arrives, map it into the section/point structure so it uses the same styling
  useEffect(() => {
    if (refineResult?.categories?.length) {
      const mapped: Section[] = refineResult.categories.map((cat, idx) => {
        const code = `SEC_${String.fromCharCode(65 + idx)}`;
        return {
          id: String(idx),
          title: cat.name,
          code,
          points: cat.questions.map((q, qIdx) => ({
            id: `${idx}-${qIdx}`,
            text: q.question,
            reviewed: false,
            dismissed: false,
          })),
        };
      });
      setSections(mapped);
    } else {
      setSections(initialSections);
    }
  }, [refineResult]);

  const togglePoint = (sectionId: string, pointId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            points: section.points.map((point) =>
              point.id === pointId
                ? { ...point, reviewed: !point.reviewed }
                : point
            ),
          }
          : section
      )
    );
  };

  const dismissPoint = (sectionId: string, pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            points: section.points.map((point) =>
              point.id === pointId
                ? { ...point, dismissed: true, reviewed: true }
                : point
            ),
          }
          : section
      )
    );
  };

  const restorePoint = (sectionId: string, pointId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            points: section.points.map((point) =>
              point.id === pointId
                ? { ...point, dismissed: false, reviewed: false }
                : point
            ),
          }
          : section
      )
    );
  };

  const { totalPoints, reviewedPoints, allReviewed } = useMemo(() => {
    const total = sections.reduce((acc, s) => acc + s.points.length, 0);
    const reviewed = sections.reduce(
      (acc, s) => acc + s.points.filter((p) => p.reviewed || p.dismissed).length,
      0
    );
    return { totalPoints: total, reviewedPoints: reviewed, allReviewed: reviewed === total };
  }, [sections]);

  const handleSubmit = () => {
    if (constraints.trim()) {
      let delay = 0;
      const delayIncrement = 300; // milliseconds between each point

      sections.forEach((section) => {
        section.points.forEach((point) => {
          if (!point.dismissed) {
            setTimeout(() => {
              setSections((prev) =>
                prev.map((s) =>
                  s.id === section.id
                    ? {
                      ...s,
                      points: s.points.map((p) =>
                        p.id === point.id ? { ...p, reviewed: true } : p
                      ),
                    }
                    : s
                )
              );
            }, delay);
            delay += delayIncrement;
          }
        });
      });

      // Clear input after all animations complete
      setTimeout(() => {
        setConstraints("");
      }, delay);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://localhost:5000/api/agents/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: userPrompt,
          user_idea: userPrompt,
          constraints: constraints,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();

      if (data.success || data.result) {
        onGeneratePlan(data.result || data);
      }
    } catch (error) {
      console.error("Error generating plan:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const truncatedPrompt = userPrompt.length > 100
    ? userPrompt.slice(0, 100) + "..."
    : userPrompt;

  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Top Bar */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-start gap-4">
            <HomeButton onClick={onHome} />
            <div className="border-l border-border pl-4 flex-1 min-w-0">
              <div className="font-mono text-xs text-primary tracking-widest uppercase mb-1">
                SOURCE_PROMPT
              </div>
              <p className="text-foreground font-mono text-sm">
                "{truncatedPrompt}"
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-6xl mx-auto px-6 py-8 pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Refine Your Concept</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Review the following constraints and provide specific answers to build your technical plan.
          </p>
        </div>


        {/* 3-Column Grid */}
        <div className="flex flex-wrap justify-center gap-6">
          {sections.map((section) => (
            <div
              key={section.id}
              className="border border-border bg-card p-4 space-y-4 transition-all duration-300 hover:border-primary/50 w-full md:w-[calc(33.333%-1rem)] md:max-w-[400px]"
            >
              {/* Section Header */}
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <span className="font-mono text-xs bg-muted px-2 py-1 text-muted-foreground">
                  {section.code}
                </span>
                <h3 className="font-mono text-xs text-primary uppercase tracking-wide">
                  {section.title}
                </h3>
              </div>

              {/* Section Points */}
              <div className="space-y-3">
                {section.points.map((point, index) => (
                  <div
                    key={point.id}
                    className={`relative w-full text-left p-3 border-y border-r transition-all duration-300 group ${point.dismissed
                      ? "border-muted/30 bg-muted/10 border-l-2 border-l-muted-foreground/30 opacity-60"
                      : point.reviewed
                        ? "border-green-500/30 bg-green-500/5 hover:border-green-400/50 hover:bg-green-500/10 border-l-2 border-l-green-500"
                        : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_12px_rgba(234,179,8,0.15)] border-l-2 border-l-red-500"
                      }`}
                  >
                    <div className="w-full text-left">
                      <div className="flex items-start gap-3 pr-8">
                        {/* Status indicator */}
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          <div
                            className={`w-2 h-2 rounded-full transition-colors ${point.dismissed
                              ? "bg-muted-foreground/30"
                              : point.reviewed
                                ? "bg-green-500"
                                : "bg-red-500"
                              }`}
                          />
                          <span className={`font-mono text-xs ${point.dismissed ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                            {String(index + 1).padStart(2, "0")}.
                          </span>
                        </div>
                        {/* Point text */}
                        <p className={`text-sm leading-relaxed ${point.dismissed
                          ? "text-muted-foreground/50 line-through decoration-muted-foreground/50"
                          : "text-muted-foreground"
                          }`}>
                          {point.text}
                        </p>
                      </div>
                    </div>
                    {/* Dismiss/Restore button */}
                    {point.dismissed ? (
                      <button
                        onClick={(e) => restorePoint(section.id, point.id, e)}
                        className="absolute top-3 right-3 p-1 text-muted-foreground/50 hover:text-primary hover:bg-primary/20 transition-all rounded"
                        title="Restore this constraint"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : !point.reviewed && (
                      <button
                        onClick={(e) => dismissPoint(section.id, point.id, e)}
                        className="absolute top-3 right-3 p-1 text-destructive/50 hover:text-destructive hover:bg-destructive/20 transition-all rounded"
                        title="Dismiss this constraint"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-6 py-4">
          {allReviewed ? (
            /* Generate Plan Button - shown when all points are reviewed */
            <div className="space-y-3">
              <Button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                size="lg"
                className="w-full py-6 text-lg font-bold uppercase tracking-wider"
              >
                {isGenerating ? "Generating..." : "Generate Plan →"}
              </Button>
              <div className="text-center font-mono text-xs text-primary">
                ✓ All {totalPoints} constraints reviewed • Ready to generate
              </div>
            </div>
          ) : (
            /* Input + Submit - shown when points still need review */
            <>
              <div className="flex gap-2 items-center">
                <div className="flex-1 border border-border bg-card">
                  <Input
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="Enter your constraints and specific requirements here..."
                    className="bg-background border-0 font-mono text-sm placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:ring-offset-0 h-12"
                    disabled={isListening}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && constraints.trim()) {
                        handleSubmit();
                      }
                    }}
                  />
                </div>
                <VoiceMicButton
                  isListening={isListening}
                  status={status}
                  audioLevels={audioLevels}
                  onToggle={toggleListening}
                  className="shrink-0"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={constraints.trim().length === 0}
                  size="lg"
                  className="px-8 font-bold uppercase tracking-wider disabled:opacity-30"
                >
                  Submit
                </Button>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-mono text-xs text-muted-foreground">
                  Press Enter to submit • Be specific about technical requirements
                </span>
                <span className={`font-mono text-xs ${reviewedPoints > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {reviewedPoints}/{totalPoints} points reviewed
                </span>
              </div>
            </>
          )}
        </div>
      </footer>

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl text-primary animate-pulse">[</span>
              <span className="inline-block w-64 overflow-hidden">
                <span className="animate-[slide-loader_1.5s_steps(20)_infinite] inline-block font-mono text-primary">
                  ████████████████████
                </span>
              </span>
              <span className="font-mono text-2xl text-primary animate-pulse">]</span>
            </div>
            <div className="font-mono text-lg text-primary tracking-widest">
              GENERATING_PLAN<span className="animate-blink">_</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefinerView;
