import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function CreatePollForm() {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // Removed: const { toast } = useToast();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      // Use sonner toast API
      toast.warning("Limit Reached", {
        description: "You can add a maximum of 10 options.",
      });
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const validOptions = options.map(opt => opt.trim()).filter(opt => opt !== '');

    if (!question.trim() || validOptions.length < 2) {
      // Use sonner toast API
      toast.error("Invalid Input", {
        description: "Please enter a question and at least two valid options.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: validOptions }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create poll');
      }

      const data: { id: string } = await response.json();
      // Use sonner toast API
      toast.success("Poll Created!", {
        description: "Redirecting to your new poll...",
      });
      navigate(`/poll/${data.id}`);

    } catch (error) {
      console.error("Poll creation failed:", error);
      // Use sonner toast API
      toast.error("Error Creating Poll", {
        description: "Could not create poll. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ... rest of the form JSX remains the same ... */}
      <div className="space-y-2">
        <Label htmlFor="question">Poll Question</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your favorite color?"
          required
          disabled={isLoading}
        />
      </div>

      <Label>Options</Label>
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            required
            disabled={isLoading}
          />
          {options.length > 2 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeOption(index)}
              disabled={isLoading}
            >
              Remove
            </Button>
          )}
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addOption} disabled={isLoading || options.length >= 10}>
        Add Option
      </Button>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  );
}

export default CreatePollForm;