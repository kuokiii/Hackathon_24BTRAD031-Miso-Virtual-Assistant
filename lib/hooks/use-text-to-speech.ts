"use client"

import { useState, useEffect, useCallback } from "react"

export function useTextToSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Get available voices
      const getVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices()
        setVoices(availableVoices)

        // Select a default voice (preferably a female voice)
        const femaleVoice = availableVoices.find(
          (voice) => voice.name.includes("female") || voice.name.includes("Samantha"),
        )
        const defaultVoice = femaleVoice || availableVoices[0]
        setSelectedVoice(defaultVoice)
      }

      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices
      }

      getVoices()

      // Clean up
      return () => {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback(
    (text: string, rate = 1, pitch = 1) => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        utterance.rate = rate
        utterance.pitch = pitch

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
      }
    },
    [selectedVoice],
  )

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    selectedVoice,
    setSelectedVoice,
    hasSupport: typeof window !== "undefined" && "speechSynthesis" in window,
  }
}

