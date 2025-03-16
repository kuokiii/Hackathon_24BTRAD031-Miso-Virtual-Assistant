"use client"

import type React from "react"

import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, MessageSquare, Mic, Volume2, Sparkles, ChevronDown, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Footer from "@/components/footer"
import CherryBlossomIcon from "@/components/cherry-blossom-icon"
import { useRef, useState, useEffect } from "react"

export default function LandingPage() {
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8])

  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check for system preference and saved preference on mount
  useEffect(() => {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark") {
      setIsDarkMode(true)
      document.documentElement.classList.add("dark")
    } else if (savedTheme === "light") {
      setIsDarkMode(false)
      document.documentElement.classList.remove("dark")
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(systemPrefersDark)

      if (systemPrefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
    setIsDarkMode(!isDarkMode)
  }

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/50" ref={containerRef}>
      {/* Theme Toggle Button */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background/80 backdrop-blur-sm"
          onClick={toggleTheme}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20 px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,192,203,0.1),transparent_40%)]" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute left-0 top-1/4 -z-10 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute right-0 bottom-1/4 -z-10 h-[20rem] w-[20rem] translate-x-1/2 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 blur-3xl"
          />
        </div>

        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-4 sm:mb-6"
            >
              <CherryBlossomIcon className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-primary" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-400"
            >
              Meet Miso
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mb-8 px-4"
            >
              Your intelligent virtual assistant with voice and text capabilities
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <Link href="/chat">
                <Button size="lg" className="rounded-full px-8 group">
                  Start Chatting
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-full px-8" onClick={scrollToFeatures}>
                Learn More
              </Button>
            </motion.div>
          </div>

          <motion.div
            style={{ opacity, scale }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative mx-auto w-full max-w-3xl rounded-2xl shadow-2xl shadow-primary/20 border border-primary/20 overflow-hidden"
          >
            <div className="aspect-[16/9] bg-muted/30 backdrop-blur-sm p-4 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <CherryBlossomIcon className="w-8 h-8 text-primary" />
                <h3 className="font-semibold text-lg">Miso Assistant</h3>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CherryBlossomIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p>Hello! I'm Miso, your smart virtual assistant. How can I help you today?</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex items-start gap-3 flex-row-reverse"
                >
                  <div className="w-8 h-8 rounded-full bg-background border border-muted flex-shrink-0"></div>
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                    <p>Can you turn on the living room lights?</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CherryBlossomIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p>I've turned on the living room lights for you. Is there anything else you'd like me to do?</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex items-start gap-3 flex-row-reverse"
                >
                  <div className="w-8 h-8 rounded-full bg-background border border-muted flex-shrink-0"></div>
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none p-3 max-w-[80%]">
                    <p>Smart Home Controls</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CherryBlossomIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-none p-3 max-w-[80%]">
                    <p>
                      Here are your smart home controls. You can manage your lights, thermostat, switches, and media
                      devices.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex justify-center mt-8 sm:mt-12"
          >
            <Button variant="ghost" size="icon" className="rounded-full animate-bounce" onClick={scrollToFeatures}>
              <ChevronDown className="h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 md:py-20 px-4 md:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12 bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-400"
          >
            Powerful Features
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="Natural Conversations"
              description="Chat with Miso using natural language. Ask questions, get recommendations, or just have a friendly conversation."
              delay={0}
            />

            <FeatureCard
              icon={<Mic className="h-6 w-6" />}
              title="Voice Recognition"
              description="Speak naturally to Miso and get voice responses. Perfect for hands-free interaction when you're busy."
              delay={0.1}
            />

            <FeatureCard
              icon={<Volume2 className="h-6 w-6" />}
              title="Text-to-Speech"
              description="Miso can read responses aloud with a natural-sounding voice, making information accessible in any situation."
              delay={0.2}
            />

            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Smart Home Control"
              description="Control your lights, thermostat, and other smart devices with simple voice commands or text instructions."
              delay={0.3}
            />

            <FeatureCard
              icon={<CherryBlossomIcon className="h-6 w-6" />}
              title="Weather Updates"
              description="Get current weather conditions and forecasts for any location. Just ask about the weather!"
              delay={0.4}
            />

            <FeatureCard
              icon={<ArrowRight className="h-6 w-6" />}
              title="News Headlines"
              description="Stay informed with the latest news from various categories. Miso can read you the headlines or search for specific topics."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 md:px-6 lg:px-8 text-center">
        <div className="container mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-400"
          >
            Ready to experience Miso?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4"
          >
            Start chatting with your new AI assistant and discover how Miso can make your life easier.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/chat">
              <Button size="lg" className="rounded-full px-8 group">
                Try Miso Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="bg-background/80 backdrop-blur-sm rounded-xl p-6 border border-primary/10 shadow-lg transition-all duration-300 h-full"
    >
      <motion.div
        whileHover={{ rotate: 15, scale: 1.1 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
        className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary"
      >
        {icon}
      </motion.div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  )
}



