import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { InputWithIcon } from './InputWithIcon';
import { AlignJustify, X } from "lucide-react"
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const optionParams = {
  minCount: 2,
  maxCount: 8,
  initialValue: [
    { key: uuidv4(), value: '' },
    { key: uuidv4(), value: '' },
  ]
}

function CreatePollForm() {

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(optionParams.initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].value = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < optionParams.maxCount) {
      setOptions([...options, { key: uuidv4(), value: '' }]);
    } else {
      toast.warning("Limit Reached", {
        description: `You can only add up to ${optionParams.maxCount} options.`,
      });
    }
  };

  const removeOption = (index: number) => {
    console.log('Removing option at index:', index);
    if (options.length > optionParams.minCount) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {

    const { active, over } = event;

    if (over && active.id !== over.id) {
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
      const response = await fetch(`${API_BASE_URL}/polls/create`, {
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4, // Prevents drag event from being triggered on button click
      },
    })
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Question</Label>
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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={options.map(option => option.key)}>
          {options.map((option, index) => (
            <SortableItem
              key={option.key}
              id={option.key}
              index={index}
              option={option.value}
              onChange={handleOptionChange}
              onRemove={() => removeOption(index)}
              isRemovable={options.length > optionParams.minCount}
              isLoading={isLoading}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button type="button" className="w-full" variant="secondary" onClick={addOption} disabled={isLoading || options.length >= optionParams.maxCount}>
        Add Option
      </Button>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Poll'}
      </Button>
    </form>
  );
}

interface SortableItemProps {
  id: string;
  index: number;
  option: string;
  onChange: (index: number, value: string) => void;
  onRemove: () => void;
  isRemovable: boolean;
  isLoading: boolean;
}

function SortableItem({ id, index, option, onChange, onRemove, isRemovable, isLoading }: SortableItemProps) {

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
    >
      <InputWithIcon
        type="text"
        value={option}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(index, e.target.value)}
        placeholder={`Option ${index + 1}`}
        required
        disabled={isLoading}
        startIcon={<AlignJustify className="h-4 w-4 cursor-grab" />}
        endIcon={
          <X
            className={cn(
              "h-4 w-4 flex items-center justify-center transition-opacity transition-duration-100",
              isRemovable ? "opacity-100 hover:opacity-75" : "opacity-0"
            )}
            onClick={onRemove}
            aria-label="Remove option"
          />
        }
      />
    </div>
  );
}

export default CreatePollForm;