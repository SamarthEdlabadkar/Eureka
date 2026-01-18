import { useState, useCallback } from "react";
import IntakeView from "@/components/IntakeView";
import LoadingView from "@/components/LoadingView";
import RefinerView from "@/components/RefinerView";
import PlanReviewView from "@/components/PlanReviewView";
import SuccessView from "@/components/SuccessView";

type View = "intake" | "loading" | "refiner" | "planReview" | "success";

type CriticalQuestion = { question: string };
type Category = { name: string; questions: CriticalQuestion[] };
type RefinementResult = { categories: Category[] };

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("intake");
  const [userPrompt, setUserPrompt] = useState("");
  const [refineResult, setRefineResult] = useState<RefinementResult | null>(null);

  const handleAnalyze = (prompt: string, result: RefinementResult | null) => {
    setUserPrompt(prompt);
    setRefineResult(result);
    setCurrentView("loading");
  };

  const handleLoadingComplete = useCallback(() => {
    setCurrentView("refiner");
  }, []);

  const handleGeneratePlan = () => {
    setCurrentView("planReview");
  };

  const handleAcceptPlan = () => {
    setCurrentView("success");
  };

  const handleHome = () => {
    setCurrentView("intake");
    setUserPrompt("");
    setRefineResult(null);
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
          onAccept={handleAcceptPlan}
          onHome={handleHome}
          onBack={handleBackToRefiner}
        />
      )}
      {currentView === "success" && (
        <SuccessView onHome={handleHome} />
      )}
    </div>
  );
};

export default Index;
