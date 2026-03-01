import React from 'react';

const WhoamiOutput: React.FC = () => (
  <div className="space-y-2">
    <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">HariHaren SS</div>
    <div className="text-gray-500 dark:text-gray-400 font-medium">Cloud Application Developer @ IBM Cloud</div>
    <div className="mt-3 space-y-1 text-gray-700 dark:text-gray-300">
      <div>🎓 <span className="text-blue-600 dark:text-blue-400 font-medium">Education:</span> B.Tech in Computer Science</div>
      <div>💼 <span className="text-green-600 dark:text-green-500 font-medium">Experience:</span> 3+ years in cloud & DevOps</div>
      <div>🌍 <span className="text-yellow-600 dark:text-yellow-400 font-medium">Location:</span> India</div>
      <div>🎯 <span className="text-purple-600 dark:text-purple-400 font-medium">Focus:</span> Go, Kubernetes, Docker, Python, React</div>
    </div>
    <div className="mt-3 text-pink-600 dark:text-pink-400 font-medium">✨ Building tools that make developers' lives easier!</div>
  </div>
);

export default WhoamiOutput;
