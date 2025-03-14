"use client"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Download, Copy, Share2, Trash2, MoreHorizontal } from "lucide-react"
import type { Message } from "./miso-assistant"
import { toast } from "@/hooks/use-toast"

interface ConversationExportProps {
  messages: Message[]
  onClearConversation: () => void
}

export default function ConversationExport({ messages, onClearConversation }: ConversationExportProps) {
  const formatMessagesForExport = () => {
    return messages
      .map((msg) => {
        const role = msg.role === "assistant" ? "Miso" : "You"
        const time = msg.timestamp.toLocaleString()
        return `${role} (${time}):\n${msg.content}\n\n`
      })
      .join("")
  }

  const handleCopyConversation = async () => {
    const text = formatMessagesForExport()
    await navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The conversation has been copied to your clipboard.",
    })
  }

  const handleDownloadTxt = () => {
    const text = formatMessagesForExport()
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `miso-conversation-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast({
      title: "Conversation downloaded",
      description: "Your conversation has been downloaded as a text file.",
    })
  }

  const handleShareConversation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My conversation with Miso",
          text: formatMessagesForExport(),
        })
        toast({
          title: "Shared successfully",
          description: "Your conversation has been shared.",
        })
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API.",
        variant: "destructive",
      })
    }
  }

  const handleClearConversation = () => {
    if (window.confirm("Are you sure you want to clear this conversation? This action cannot be undone.")) {
      onClearConversation()
      toast({
        title: "Conversation cleared",
        description: "Your conversation has been cleared.",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyConversation} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Copy conversation
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadTxt} className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Download as text
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareConversation} className="cursor-pointer">
          <Share2 className="mr-2 h-4 w-4" />
          Share conversation
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleClearConversation}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear conversation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

