import { formatDistanceToNow } from "date-fns"
import type { Message } from "./miso-assistant"
import { cn } from "@/lib/utils"
import CherryBlossomIcon from "./cherry-blossom-icon"

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant"
  const formattedTime = formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })

  return (
    <div className={cn("flex items-start gap-3", !isAssistant && "flex-row-reverse")}>
      {isAssistant ? (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CherryBlossomIcon className="w-4 h-4 text-primary" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-background border border-muted flex-shrink-0" />
      )}

      <div className={cn("max-w-[80%]", !isAssistant && "items-end")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isAssistant
              ? "bg-muted/50 text-foreground rounded-tl-none"
              : "bg-primary text-primary-foreground rounded-tr-none",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {isAssistant ? "Miso" : "You"} • {formattedTime}
        </p>
      </div>
    </div>
  )
}

