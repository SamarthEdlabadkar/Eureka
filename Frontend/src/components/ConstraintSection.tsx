interface ConstraintSectionProps {
  title: string;
  code: string;
  points: string[];
  completedPoints: Set<string>;
  onTogglePoint: (pointId: string) => void;
  sectionIndex: number;
}

const ConstraintSection = ({ 
  title, 
  code, 
  points, 
  completedPoints, 
  onTogglePoint,
  sectionIndex 
}: ConstraintSectionProps) => {
  return (
    <div className="card-industrial p-6 flex flex-col gap-4 animate-slide-up">
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1">
          {code}
        </span>
        <h3 className="section-header">{title}</h3>
      </div>

      {/* Data Points */}
      <div className="flex flex-col gap-4">
        {points.map((point, index) => {
          const pointId = `${sectionIndex}-${index}`;
          const isCompleted = completedPoints.has(pointId);
          
          return (
            <button
              key={index}
              onClick={() => onTogglePoint(pointId)}
              className={`data-point text-left transition-all duration-200 cursor-pointer hover:opacity-80 ${
                isCompleted 
                  ? 'border-l-2 border-l-green-500 bg-green-500/10 pl-3' 
                  : 'border-l-2 border-l-red-500 bg-red-500/10 pl-3'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  isCompleted ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-mono text-xs text-muted-foreground">
                  {String(index + 1).padStart(2, '0')}.
                </span>
              </span>
              <span className="mt-1 block">{point}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConstraintSection;
