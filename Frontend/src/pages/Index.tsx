import { useState, useCallback } from "react";
import IntakeView from "@/components/IntakeView";
import LoadingView from "@/components/LoadingView";
import RefinerView from "@/components/RefinerView";
import PlanReviewView from "@/components/PlanReviewView";
import SuccessView from "@/components/SuccessView";
import { GraphView } from "@/components/graph/GraphView";

type View = "intake" | "loading" | "refiner" | "planReview" | "graph" | "success";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("intake");
  const [userPrompt, setUserPrompt] = useState("");
  const [refineResult, setRefineResult] = useState<RefinementResult | null>(null);
  const [planData, setPlanData] = useState<any>(null);

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

  const handleAcceptPlan = () => {
    setCurrentView("graph");
  };

  const handleHome = () => {
    setCurrentView("intake");
    setUserPrompt("");
    setRefineResult(null);
    setPlanData(null);
  };

  const handleBackToRefiner = () => {
    setCurrentView("refiner");
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
      {currentView === "graph" && (
        <GraphView onHome={handleHome} />
      )}
      {currentView === "success" && (
        <SuccessView onHome={handleHome} />
      )}
    </div>
  );
};

export default Index;
