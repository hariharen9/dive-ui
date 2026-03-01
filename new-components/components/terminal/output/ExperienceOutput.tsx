import React from 'react';
import { timelineEvents } from '../../../data/timeline';

const ExperienceOutput: React.FC = () => (
  <div className="space-y-4 text-gray-700 dark:text-gray-300">
    <div className="text-cyan-600 dark:text-cyan-400 font-bold">💼 Professional Experience:</div>
    {timelineEvents.filter(event => event.type === 'work').map((event, index) => (
      <div key={index} className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-yellow-600 dark:text-yellow-400 font-semibold">{event.title}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{event.date}</span>
        </div>
        <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">{event.subtitle}</div>
        <div className="pl-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{event.description}</div>
      </div>
    ))}
  </div>
);

export default ExperienceOutput;
