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
    (text: string, rate = 1, pitch = 1, voiceType = "female_default") => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Select voice based on voiceType
        if (voices.length > 0) {
          let voice = null

          // Prioritize English female voices
          if (voiceType === "female_default" || voiceType === "female_japanese") {
            voice = voices.find(
              (v) =>
                (v.lang.includes("en") || v.lang.includes("EN")) &&
                (v.name.includes("female") ||
                  v.name.includes("Female") ||
                  v.name.includes("Samantha") ||
                  v.name.includes("Karen")),
            )
          } else if (voiceType === "female_soft") {
            voice = voices.find(
              (v) =>
                (v.lang.includes("en") || v.lang.includes("EN")) &&
                (v.name.includes("Samantha") || v.name.includes("Karen")),
            )
          } else if (voiceType === "female_clear") {
            voice = voices.find(
              (v) =>
                (v.lang.includes("en") || v.lang.includes("EN")) &&
                v.name.includes("Google") &&
                (v.name.includes("female") || v.name.includes("Female") || !v.name.includes("Male")),
            )
          } else if (voiceType === "male") {
            voice = voices.find(
              (v) =>
                (v.lang.includes("en") || v.lang.includes("EN")) &&
                (v.name.includes("male") || v.name.includes("Male")),
            )
          }

          // Fallback to any English voice if specific type not found
          if (!voice) {
            voice = voices.find((v) => v.lang.includes("en") || v.lang.includes("EN"))
          }

          // Last resort: any available voice
          if (!voice && voices.length > 0) {
            voice = voices[0]
          }

          if (voice) {
            utterance.voice = voice
          }
        } else if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        // Ensure English language
        utterance.lang = "en-US"

        utterance.rate = rate
        utterance.pitch = pitch

        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
      }
    },
    [voices, selectedVoice],
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

