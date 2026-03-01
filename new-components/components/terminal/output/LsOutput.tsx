import React from 'react';

const LsOutput: React.FC<{ items: { name: string; isDir: boolean }[] }> = ({ items }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {items.map((item) => (
      <div key={item.name} className="flex items-center space-x-1">
        {item.isDir ? (
          <>
            <span className="text-blue-600 dark:text-blue-400">📁</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{item.name}/</span>
          </>
        ) : (
          <>
            <span className="text-gray-500 dark:text-gray-400 font-medium">📄</span>
            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
          </>
        )}
      </div>
    ))}
  </div>
);

export default LsOutput;
