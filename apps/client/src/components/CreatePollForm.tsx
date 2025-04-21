import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function CreatePollForm() {

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ key: string, value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setOptions([
      { key: uuidv4(), value: '' },
      { key: uuidv4(), value: '' },
    ]);
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].value = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, { key: uuidv4(), value: '' }]);
    } else {
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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setOptions((prevOptions) => {
        const oldIndex = prevOptions.findIndex(option => option.key === active.id);
        const newIndex = prevOptions.findIndex(option => option.key === over.id);
        return arrayMove(prevOptions, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const validOptions = options.map(opt => opt.value.trim()).filter(opt => opt !== '');

    if (!question.trim() || validOptions.length < 2) {
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

      const data: { shortCode: string } = await response.json();
      toast.success("Poll Created!", {
        description: "Redirecting to your new poll...",
      });
      navigate(`/poll/${data.shortCode}`);

    } catch (error) {
      console.error("Poll creation failed:", error);
      toast.error("Error Creating Poll", {
        description: "Could not create poll. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={options.map(option => option.key)}>
          {options.map((option, index) => (
            <SortableItem
              key={option.key}
              id={option.key}
              index={index}
              option={option.value}
              onChange={handleOptionChange}
              onRemove={removeOption}
              isLoading={isLoading}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button type="button" variant="secondary" onClick={addOption} disabled={isLoading || options.length >= 10}>
        Add Option
      </Button>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  );
}

function SortableItem({ id, index, option, onChange, onRemove, isLoading }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center space-x-2">
      <Input
        type="text"
        value={option}
        onChange={(e) => onChange(index, e.target.value)}
        placeholder={`Option ${index + 1}`}
        required
        disabled={isLoading}
      />
      {onRemove && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={isLoading}
        >
          Remove
        </Button>
      )}
    </div>
  );
}

export default CreatePollForm;