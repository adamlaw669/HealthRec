'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card } from './card';
import { FaChevronDown, FaChevronUp, FaTimes, FaHistory, FaInfoCircle } from 'react-icons/fa';
import { healthAPI } from "../../app/api/api";

interface HealthResponse {
  title: string;
  content: string;
}

interface ParsedResponse {
  measurements: HealthResponse;
  normalRanges: HealthResponse;
  implications: HealthResponse;
  recommendations: HealthResponse;
  medicalAdvice: HealthResponse;
}

export const HealthInterpreter = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await healthAPI.explainHealthMetric(message);
      setResponse(result.explanation);
    } catch (error) {
      console.error("Error:", error);
      setResponse("Sorry, I couldn't process your request.");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about your health metrics..."
          className="w-full"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Get Explanation"}
        </Button>
      </form>
      {response && (
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-800 dark:text-gray-200">{response}</p>
        </div>
      )}
    </div>
  );
};