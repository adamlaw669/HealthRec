'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
//import { Card } from './card';
import { FaChevronDown, FaChevronUp, FaTimes, FaHistory } from 'react-icons/fa';
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

export function HealthInterpreter() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<ParsedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ question: string; response: ParsedResponse }>>([]);
  const [metricSuggestions] = useState<Array<{ type: string, example: string }>>([
    { type: 'Blood Pressure', example: 'My blood pressure is 120/80' },
    { type: 'Blood Sugar', example: 'My blood sugar is 108 mg/dL' },
    { type: 'Heart Rate', example: 'My heart rate is 72 bpm' },
    { type: 'Respiratory Rate', example: 'My breathing rate is 16 breaths per minute' },
    { type: 'Body Temperature', example: 'My temperature is 37.2°C' },
    { type: 'Oxygen Saturation', example: 'My oxygen level is 98%' }
  ]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const parseResponse = (text: string): ParsedResponse => {
    // First, clean up the text
    const cleanText = text
      .replace(/^Hey there!\s*/, '')
      .replace(/\*\*/g, '') // Remove emphasis markers
      .trim();

    // Split text into sections based on numbered points and cleanup
    const sections = cleanText
      .split(/(?=\d+\.)/) // Split on numbered sections
      .filter(Boolean)
      .map(section => section.trim());

    // Initialize section contents with default values
    let measurements = 'Analyzing your measurements...';
    let normalRanges = 'Analyzing normal ranges...';
    let implications = 'Analyzing health implications...';
    let recommendations = 'Preparing recommendations...';
    let medicalAdvice = 'This information is for educational purposes only and not a substitute for professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.';

    // Map sections based on their content
    sections.forEach((section) => {
      const sectionText = section.replace(/^\d+\.\s+/, '').trim();

      if (section.match(/^1\./)) {
        measurements = sectionText;
      } else if (section.match(/^2\./)) {
        normalRanges = sectionText;
      } else if (section.match(/^3\./)) {
        implications = sectionText;
      } else if (section.match(/^4\./)) {
        recommendations = sectionText;
      } else if (section.match(/^5\./)) {
        medicalAdvice = sectionText;
      }
    });

    // Log sections for debugging
    console.log('Parsed sections:', {
      measurements,
      normalRanges,
      implications,
      recommendations,
      medicalAdvice
    });

    return {
      measurements: {
        title: "Understanding Your Measurements",
        content: measurements
      },
      normalRanges: {
        title: "Normal Ranges",
        content: normalRanges
      },
      implications: {
        title: "What This Means",
        content: implications
      },
      recommendations: {
        title: "Recommendations",
        content: recommendations
      },
      medicalAdvice: {
        title: "Medical Advice",
        content: medicalAdvice
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);
    try {
      console.log('Sending request to health interpreter:', message);
      // Use the healthAPI.explainHealthMetric function
      const data = await healthAPI.explainHealthMetric(message);
      console.log('Received response from health interpreter:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const parsedResponse = parseResponse(data.explanation);
      console.log('Parsed response:', parsedResponse);
      setResponse(parsedResponse);
      setHistory((prev) => [...prev, { question: message, response: parsedResponse }]);
      setShowModal(true);
      localStorage.setItem(
        "healthHistory",
        JSON.stringify([...history, { question: message, response: parsedResponse }])
      );
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
    setIsLoading(false);
    setMessage("");
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSuggestionClick = (example: string) => {
    setMessage(example);
    //setShowSuggestions(false);
    setShowSuggestions(showSuggestions === true ? false : true); 
    //setExpandedSection(expandedSection === section ? null : section);
  };
/*
  const Section = ({ title, content }: HealthResponse) => (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => toggleSection(title)}
        className="flex justify-between items-center w-full px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {expandedSection === title ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {expandedSection === title && (
        <div className="px-4 py-3 text-gray-700 dark:text-gray-300 max-h-[300px] overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
*/
  return (
    <>
      {/* Hidden trigger button for dashboard */}
      <button
        data-health-interpreter
        onClick={() => setShowModal(true)}
        className="hidden"
        aria-hidden="true"
      />
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-semibold">Health Metrics Interpreter</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
              <div className="p-4">
                <div className="mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Enter your health measurements or click a suggestion below:
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {metricSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion.example)}
                        className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        {suggestion.type}
                      </button>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="mb-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Enter your health metrics (e.g., 'My blood pressure is 120/80')"
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Analyzing...' : 'Ask'}
                    </Button>
                  </div>
                </form>
                {response && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {Object.values(response).map((section, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => toggleSection(section.title)}
                          className="flex justify-between items-center w-full px-4 py-3 text-left"
                        >
                          <span className="font-medium text-gray-900 dark:text-white">{section.title}</span>
                          {expandedSection === section.title ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                        {expandedSection === section.title && (
                          <div className="px-4 py-3 text-gray-700 dark:text-gray-300">
                            {section.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {history.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FaHistory />
                      <h3 className="font-medium">Previous Questions</h3>
                    </div>
                    <div className="space-y-2">
                      {history.slice(-3).map((item, index) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600"
                          onClick={() => {
                            setResponse(item.response);
                            setExpandedSection('measurements');
                          }}
                        >
                          {item.question}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}