'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Card } from './card';

export function HealthInterpreter() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/explain_health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const data = await res.json();
            setResponse(data.explanation);
        } catch (error) {
            setResponse('Sorry, I had trouble processing your question. Please try again.');
            console.error('Error:', error);
        }
        setIsLoading(false);
    };

    return (
        <Card className="w-full max-w-2xl mx-auto p-6">
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-6">
                    Ask About Your Health Metrics
                </h2>

                {/* Example prompts */}
                <div className="text-sm text-gray-600 mb-4">
                    <p className="font-medium mb-2">Example questions:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>"My blood pressure is 120/80, what does this mean?"</li>
                        <li>"Heart rate 85, is this normal?"</li>
                        <li>"What does sys 120 dia 80 mean?"</li>
                    </ul>
                </div>

                {/* Response display */}
                {response && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h3 className="font-medium mb-2">Interpretation:</h3>
                        <div className="whitespace-pre-wrap text-gray-700">
                            {response}
                        </div>
                    </div>
                )}

                {/* Input form */}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter your health metrics or question..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Analyzing...' : 'Ask'}
                    </Button>
                </form>
            </div>
        </Card>
    );
} 