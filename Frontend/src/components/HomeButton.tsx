import { Home } from "lucide-react";

interface HomeButtonProps {
  onClick: () => void;
}

const HomeButton = ({ onClick }: HomeButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 font-mono text-xs text-muted-foreground hover:text-primary transition-all duration-200 group"
    >
      <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">HOME</span>
    </button>
  );
};

export default HomeButton;
