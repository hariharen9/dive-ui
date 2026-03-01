import React from 'react';

const SkillsOutput: React.FC = () => (
  <div className="space-y-3 text-gray-700 dark:text-gray-300">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold">💻 Technical Skills:</div>
    <div className="space-y-2">
      <div>
        <div className="text-yellow-600 dark:text-yellow-400 font-medium">Languages:</div>
        <div className="pl-4">Go, Python, JavaScript/TypeScript</div>
      </div>
      <div>
        <div className="text-green-600 dark:text-green-500 font-medium">Cloud & DevOps:</div>
        <div className="pl-4">Kubernetes, Docker, IBM Cloud, AWS, Azure</div>
      </div>
      <div>
        <div className="text-blue-600 dark:text-blue-400 font-medium">Frameworks:</div>
        <div className="pl-4">React, Node.js, Flutter, Next.js</div>
      </div>
      <div>
        <div className="text-purple-600 dark:text-purple-400 font-medium">Tools:</div>
        <div className="pl-4">Git, Jenkins, Tekton, Terraform, Ansible</div>
      </div>
    </div>
    <div className="text-pink-600 dark:text-pink-400 mt-3 font-medium">💡 Tip: Try 'cd skills' and 'ls' to explore more!</div>
  </div>
);

export default SkillsOutput;
