import React from 'react';

const ContactOutput: React.FC = () => (
  <div className="space-y-2 text-gray-700 dark:text-gray-300">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold mb-3">📬 Get in Touch:</div>
    <div className="space-y-1">
      <div>📧 <span className="text-yellow-600 dark:text-yellow-400 font-medium">Email:</span> Available on LinkedIn</div>
      <div>💼 <span className="text-green-600 dark:text-green-500 font-medium">LinkedIn:</span> linkedin.com/in/hariharen9</div>
      <div>🐙 <span className="text-blue-600 dark:text-blue-400 font-medium">GitHub:</span> github.com/hariharen9</div>
      <div>🐦 <span className="text-sky-600 dark:text-sky-400 font-medium">Twitter:</span> @thisishariharen</div>
      <div>📝 <span className="text-purple-600 dark:text-purple-400 font-medium">Medium:</span> @hariharen</div>
    </div>
    <div className="text-pink-600 dark:text-pink-400 mt-3 font-medium">💡 Tip: Type 'socials' for clickable links!</div>
  </div>
);

export default ContactOutput;
