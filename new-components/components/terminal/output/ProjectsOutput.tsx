import React from 'react';

const ProjectsOutput: React.FC = () => (
  <div className="space-y-2 text-gray-700 dark:text-gray-300">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold mb-3">🚀 Featured Projects:</div>
    <div className="space-y-3">
      <div>
        <div className="text-yellow-600 dark:text-yellow-400 font-medium">→ JobTrac</div>
        <div className="pl-4 text-sm font-medium">Job search command center with Kanban board</div>
      </div>
      <div>
        <div className="text-green-600 dark:text-green-500 font-medium">→ SpendWiser</div>
        <div className="pl-4 text-sm font-medium">Personal finance tracker & dashboard</div>
      </div>
      <div>
        <div className="text-blue-600 dark:text-blue-400 font-medium">→ LamaCLI</div>
        <div className="pl-4 text-sm font-medium">LLM in your terminal via Ollama</div>
      </div>
      <div>
        <div className="text-purple-600 dark:text-purple-400 font-medium">→ LocalSeek</div>
        <div className="pl-4 text-sm font-medium">Privacy-first AI chat for VS Code</div>
      </div>
    </div>
    <div className="text-pink-600 dark:text-pink-400 mt-3 font-medium">💡 Tip: Try 'cd projects' and 'cat jobtrac.txt' for details!</div>
  </div>
);

export default ProjectsOutput;
