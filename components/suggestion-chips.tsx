"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

interface SuggestionChipsProps {
  onSuggestionClick: (suggestion: string) => void
}

export default function SuggestionChips({ onSuggestionClick }: SuggestionChipsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Update suggestions based on context or time of day
  useEffect(() => {
    const hour = new Date().getHours()

    if (hour >= 5 && hour < 12) {
      // Morning suggestions
      setSuggestions([
        "Good morning! What's the weather today?",
        "Turn on the kitchen lights",
        "What's in the news today?",
        "Smart Home Controls",
      ])
    } else if (hour >= 12 && hour < 18) {
      // Afternoon suggestions
      setSuggestions([
        "What's the weather forecast?",
        "Turn on the living room lights",
        "Show me the latest technology news",
        "Smart Home Controls",
      ])
    } else {
      // Evening suggestions
      setSuggestions([
        "Turn off all the lights",
        "What's the weather tomorrow?",
        "Show me the latest news headlines",
        "Smart Home Controls",
      ])
    }
  }, [])

  return (
    <AnimatePresence>
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="flex flex-wrap gap-2 mt-4"
        >
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

