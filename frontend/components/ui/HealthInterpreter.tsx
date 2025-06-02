'use client';

import React, { useState } from 'react';
import { FaBrain } from 'react-icons/fa';

interface HealthInterpreterProps {
  insights: string[];
  isLoading?: boolean;
}

export const HealthInterpreter: React.FC<HealthInterpreterProps> = ({ insights, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FaBrain className="text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">AI Health Insights</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </button>
      </div>
      <div className={`space-y-2 ${isExpanded ? '' : 'max-h-20 overflow-hidden'}`}>
        {insights.map((insight, index) => (
          <p key={index} className="text-gray-600 dark:text-gray-300 text-sm">
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
};