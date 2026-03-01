import React from 'react';
import { socialLinks } from '../../../data/socials';

const SocialsOutput: React.FC = () => (
  <div className="space-y-2">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold mb-3">🌐 Find me online:</div>
    {socialLinks.map((social) => (
      <div key={social.label} className="flex items-center space-x-2">
        <span className="text-yellow-600 dark:text-yellow-400 font-medium">→</span>
        <span className="text-gray-600 dark:text-gray-400">{social.label}:</span>
        <a
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline font-medium"
        >
          {social.href}
        </a>
      </div>
    ))}
  </div>
);

export default SocialsOutput;
