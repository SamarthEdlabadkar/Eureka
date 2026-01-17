import { useState } from "react";
import InputView from "@/components/InputView";
import ConstraintsView from "@/components/ConstraintsView";
import LoadingTransition from "@/components/LoadingTransition";

type ViewState = "input" | "loading" | "constraints";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>("input");
  const [userPrompt, setUserPrompt] = useState("");

  const handleAnalyze = (prompt: string) => {
    setUserPrompt(prompt);
    setCurrentView("loading");
  };

  const handleLoadingComplete = () => {
    setCurrentView("constraints");
  };

  const handleBack = () => {
    setCurrentView("input");
  };

  return (
    <div className="min-h-screen bg-background">
      {currentView === "input" && (
        <InputView onAnalyze={handleAnalyze} />
      )}
      {currentView === "loading" && (
        <LoadingTransition userPrompt={userPrompt} onComplete={handleLoadingComplete} />
      )}
      {currentView === "constraints" && (
        <ConstraintsView userPrompt={userPrompt} onBack={handleBack} />
      )}
    </div>
  );
};

export default Index;
