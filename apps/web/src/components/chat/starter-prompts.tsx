'use client'

import { FC } from 'react'

interface StarterPromptsProps {
  onPromptSelect: (prompt: string) => void
}

export const StarterPrompts: FC<StarterPromptsProps> = ({ onPromptSelect }) => {
  const prompts = [
    {
      title: "Log a repair",
      description: "Mark the starter relay as replaced and add receipt photo.",
      prompt: "Help me log a repair for my vehicle. I need to document that I replaced the starter relay and add a receipt photo."
    },
    {
      title: "Predict weak spots", 
      description: "Analyze the harness and show which wires are at risk of overheating.",
      prompt: "Analyze my vehicle's wiring harness and identify which wires might be at risk of overheating or failure."
    },
    {
      title: "Explore",
      description: "Highlight circuits connected to ignition",
      prompt: "Show me all the electrical circuits that are connected to the ignition system in my vehicle."
    },
    {
      title: "Source parts",
      description: "Find compatible alternator connector near me.",
      prompt: "Help me find a compatible alternator connector for my vehicle and locate suppliers near me."
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-2 p-3 w-full max-w-2xl">
      {prompts.map((prompt, index) => (
        <div
          key={index}
          onClick={() => onPromptSelect(prompt.prompt)}
          className="p-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors bg-card"
        >
          <h3 className="font-medium text-foreground text-sm mb-1">{prompt.title}</h3>
          <p className="text-xs text-muted-foreground">{prompt.description}</p>
        </div>
      ))}
    </div>
  )
}