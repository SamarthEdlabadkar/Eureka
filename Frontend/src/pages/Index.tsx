import { useState, useCallback } from "react";
import IntakeView from "@/components/IntakeView";
import LoadingView from "@/components/LoadingView";
import RefinerView from "@/components/RefinerView";
import PlanReviewView from "@/components/PlanReviewView";
import SuccessView from "@/components/SuccessView";

type View = "intake" | "loading" | "refiner" | "planReview" | "success";

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("intake");
  const [userPrompt, setUserPrompt] = useState("");

  const handleAnalyze = (prompt: string) => {
    setUserPrompt(prompt);
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
