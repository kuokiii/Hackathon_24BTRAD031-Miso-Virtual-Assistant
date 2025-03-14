import { type NextRequest, NextResponse } from "next/server"
import type { Message } from "@/components/miso-assistant"
import { commandProcessor } from "@/lib/services/command-processor"

interface Response {
  id: string
  choices: {
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model, temperature, systemPrompt } = await request.json()

    // Get API key from environment variable
    const apiKey =
      process.env. || 

    if (!apiKey) {
      return NextResponse.json({ error: "API key is not configured" }, { status: 500 })
    }

    // Check if the last message contains a command we can process directly
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === "user") {
      try {
        // Try to process as a command
        const commandResult = await commandProcessor.processCommand(lastMessage.content)

        // If we successfully processed the command, return the result
        if (commandResult.success) {
          return NextResponse.json({ content: commandResult.response, data: commandResult.data })
        }
      } catch (error) {
        console.error("Error processing command:", error)
        // Continue with AI processing if command processing fails
      }
    }

    // Format messages for the API
    const formattedMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add system message at the beginning
    const apiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...formattedMessages,
    ]

    const response = await fetch("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": request.headers.get("origin") || "https://miso-ai.vercel.app", // Required for 
        "X-Title": "Miso Assistant", // Optional but recommended
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        temperature: temperature,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: errorData.error?.message || "Failed to generate response" },
        { status: response.status },
      )
    }

    const data: OpenRouterResponse = await response.json()
    return NextResponse.json({ content: data.choices[0].message.content })
  } catch (error) {
    console.error("Error in chat API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

