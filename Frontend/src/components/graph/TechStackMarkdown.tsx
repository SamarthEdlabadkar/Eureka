import { ScrollArea } from "@/components/ui/scroll-area";

interface TechStackMarkdownProps {
  trdContent?: string;
  trdStructure?: any;
  sections?: string[];
  wordCount?: number;
}

const TECH_STACK_CONTENT = `# TECH_STACK_OUTPUT

## Frontend

### Framework
- **React 18.3** - Component-based UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling

### Styling
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Framer Motion** - Animations

### State & Routing
- **React Router** - Client-side routing
- **TanStack Query** - Server state management

---

## Visualization

### Graph Engine
- **@xyflow/react** - Node-based graphs
- **dagre** - Automatic layout algorithm

### Features
- Criticality-based coloring
- Interactive node selection
- Directional edge arrows

---

## Architecture

### Component Structure
\`\`\`
src/
├── components/
│   ├── graph/
│   │   ├── DependencyGraph.tsx
│   │   ├── CriticalityNode.tsx
│   │   └── NodeDetailSheet.tsx
│   └── ui/
├── pages/
└── hooks/
\`\`\`

### Data Flow
1. \`MOCK_GRAPH_DATA\` → Graph nodes
2. \`dagre\` → Layout calculation
3. \`ReactFlow\` → Rendering
4. Click events → Detail sheet

---

## Performance

| Metric | Target |
|--------|--------|
| Initial Load | < 2s |
| Node Render | < 16ms |
| Interaction | < 100ms |

---

## Security Considerations

- [ ] Input sanitization
- [ ] XSS prevention
- [ ] CSP headers
- [x] No sensitive data exposure
`;

export function TechStackMarkdown({ trdContent, trdStructure, sections, wordCount }: TechStackMarkdownProps) {
  // Use real TRD content from endpoint, fall back to default if not available
  const content = trdContent || TECH_STACK_CONTENT;
  const displaySections = sections && sections.length > 0 ? sections : [];
  const displayWordCount = wordCount && wordCount > 0 ? wordCount : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 font-mono text-sm">
        {/* TRD Metadata */}
        {(displaySections.length > 0 || displayWordCount) && (
          <div className="mb-4 pb-4 border-b border-border text-xs text-muted-foreground">
            {displaySections.length > 0 && (
              <div className="mb-2">
                <span className="text-primary">SECTIONS:</span> {displaySections.join(' • ')}
              </div>
            )}
            {displayWordCount && (
              <div>
                <span className="text-primary">WORDS:</span> {displayWordCount}
              </div>
            )}
          </div>
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          {content.split('\n').map((line, index) => {
            // Headers
            if (line.startsWith('# ')) {
              return (
                <h1 key={index} className="text-xl font-bold text-foreground border-b border-border pb-2 mb-4">
                  {line.replace('# ', '')}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2 key={index} className="text-lg font-bold text-foreground mt-6 mb-3">
                  {line.replace('## ', '')}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3 key={index} className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-4 mb-2">
                  {line.replace('### ', '')}
                </h3>
              );
            }

            // Horizontal rule
            if (line.startsWith('---')) {
              return <hr key={index} className="border-border my-4" />;
            }

            // List items with bold
            if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.+?)\*\*(.*)$/);
              if (match) {
                return (
                  <div key={index} className="flex items-start gap-2 mb-1 pl-2">
                    <span className="text-muted-foreground">›</span>
                    <span>
                      <span className="text-foreground font-bold">{match[1]}</span>
                      <span className="text-muted-foreground">{match[2]}</span>
                    </span>
                  </div>
                );
              }
            }

            // Regular list items
            if (line.startsWith('- ')) {
              return (
                <div key={index} className="flex items-start gap-2 mb-1 pl-2">
                  <span className="text-muted-foreground">›</span>
                  <span className="text-muted-foreground">{line.replace('- ', '')}</span>
                </div>
              );
            }

            // Checkbox items
            if (line.startsWith('- [ ]') || line.startsWith('- [x]')) {
              const checked = line.startsWith('- [x]');
              const text = line.replace(/- \[.\] /, '');
              return (
                <div key={index} className="flex items-center gap-2 mb-1 pl-2">
                  <span className={checked ? "text-green-500" : "text-muted-foreground"}>
                    {checked ? '✓' : '○'}
                  </span>
                  <span className={checked ? "text-foreground" : "text-muted-foreground"}>
                    {text}
                  </span>
                </div>
              );
            }

            // Code blocks
            if (line.startsWith('```')) {
              return null;
            }
            if (line.startsWith('src/') || line.startsWith('├') || line.startsWith('│') || line.startsWith('└')) {
              return (
                <div key={index} className="text-xs text-green-400 font-mono pl-4">
                  {line}
                </div>
              );
            }

            // Table header
            if (line.startsWith('| Metric')) {
              return (
                <div key={index} className="grid grid-cols-2 gap-2 mt-2 text-xs border-b border-border pb-1">
                  <span className="text-muted-foreground font-bold">METRIC</span>
                  <span className="text-muted-foreground font-bold">TARGET</span>
                </div>
              );
            }

            // Table separator
            if (line.startsWith('|---')) {
              return null;
            }

            // Table rows
            if (line.startsWith('| ') && !line.startsWith('| Metric') && !line.startsWith('|---')) {
              const cells = line.split('|').filter(c => c.trim());
              if (cells.length >= 2) {
                return (
                  <div key={index} className="grid grid-cols-2 gap-2 text-xs py-1">
                    <span className="text-foreground">{cells[0].trim()}</span>
                    <span className="text-green-400">{cells[1].trim()}</span>
                  </div>
                );
              }
            }

            // Numbered list
            if (/^\d+\./.test(line)) {
              const match = line.match(/^(\d+)\. (.+)$/);
              if (match) {
                return (
                  <div key={index} className="flex items-start gap-2 mb-1 pl-2">
                    <span className="text-muted-foreground text-xs">{match[1]}.</span>
                    <span className="text-muted-foreground">{match[2].replace(/`(.+?)`/g, (_, code) => code)}</span>
                  </div>
                );
              }
            }

            // Empty lines
            if (line.trim() === '') {
              return <div key={index} className="h-2" />;
            }

            return (
              <p key={index} className="text-muted-foreground mb-1">
                {line}
              </p>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
