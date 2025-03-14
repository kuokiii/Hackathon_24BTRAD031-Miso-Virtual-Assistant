"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AssistantAvatarProps {
  size?: "sm" | "md" | "lg"
}

export default function AssistantAvatar({ size = "md" }: AssistantAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  }

  return (
    <motion.div
      className={cn(
        "relative rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center",
        sizeClasses[size],
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-1 rounded-full bg-background flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          className={cn(
            "rounded-full bg-gradient-to-br from-primary to-primary-foreground",
            size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6",
          )}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />
      </motion.div>
    </motion.div>
  )
}

