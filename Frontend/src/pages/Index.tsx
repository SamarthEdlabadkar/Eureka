import { useState, useCallback } from "react";
import IntakeView from "@/components/IntakeView";
import LoadingView from "@/components/LoadingView";
import RefinerView from "@/components/RefinerView";
import PlanReviewView from "@/components/PlanReviewView";
import SuccessView from "@/components/SuccessView";
import { GraphView } from "@/components/graph/GraphView";

type View = "intake" | "loading" | "refiner" | "planReview" | "phaseII" | "graph" | "success";

type CriticalQuestion = { question: string };
type Category = { name: string; questions: CriticalQuestion[] };
type RefinementResult = { categories: Category[] };

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("intake");
  const [userPrompt, setUserPrompt] = useState("");
  const [refineResult, setRefineResult] = useState<RefinementResult | null>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [phaseIIData, setPhaseIIData] = useState<any>(null);

  const handleAnalyze = (prompt: string, result: RefinementResult | null) => {
    setUserPrompt(prompt);
    setRefineResult(result);
    setCurrentView("loading");
  };

  const handleLoadingComplete = useCallback(() => {
    setCurrentView("refiner");
  }, []);

  const handleGeneratePlan = (data: any) => {
    setPlanData(data);
    setCurrentView("planReview");
  };

  const handleAcceptPlan = async () => {
    // Move to phaseII view
    setCurrentView("phaseII");

    try {
      // Call Phase II API endpoint
      const response = await fetch("http://localhost:5000/api/agents/phase-ii", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_description: userPrompt,
          strategic_plan: planData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate Phase II analysis");
      }

      const data = await response.json();

      if (data.success || data.result) {
        setPhaseIIData(data.result || data);
      }
    } catch (error) {
      console.error("Error generating Phase II analysis:", error);
    }
  };

  const handleHome = () => {
    setCurrentView("intake");
    setUserPrompt("");
    setRefineResult(null);
    setPlanData(null);
    setPhaseIIData(null);
  };

  const handleBackToRefiner = () => {
    setCurrentView("refiner");
  };

  const handlePhaseIIComplete = () => {
    setCurrentView("graph");
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === "intake" && (
        <IntakeView onAnalyze={handleAnalyze} />
      )}
      {currentView === "loading" && (
        <LoadingView onComplete={handleLoadingComplete} onHome={handleHome} />
      )}
      {currentView === "refiner" && (
        <RefinerView
          userPrompt={userPrompt}
          refineResult={refineResult}
          onHome={handleHome}
          onGeneratePlan={handleGeneratePlan}
        />
      )}
      {currentView === "planReview" && (
        <PlanReviewView
          planData={planData}
          onAccept={handleAcceptPlan}
          onHome={handleHome}
          onBack={handleBackToRefiner}
        />
      )}
      {currentView === "phaseII" && (
        <GraphView onHome={handleHome} phaseIIData={phaseIIData} />
      )}
      {currentView === "graph" && (
        <GraphView onHome={handleHome} phaseIIData={phaseIIData} />
      )}
      {currentView === "success" && (
        <SuccessView onHome={handleHome} />
      )}
    </div>
  );
};

export default Index;
