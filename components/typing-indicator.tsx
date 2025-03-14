"use client"

import { motion } from "framer-motion"

export default function TypingIndicator() {
  return (
    <div className="px-4 py-3 bg-muted/50 rounded-2xl rounded-tl-none inline-flex items-center">
      <div className="flex space-x-1">
        {[0, 1, 2].map((dot) => (
          <motion.div
            key={dot}
            className="w-2 h-2 bg-primary/60 rounded-full"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              delay: dot * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  )
}

