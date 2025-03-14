import type { Message } from "@/components/miso-assistant"

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

export async function generateResponse(
  messages: Message[],
  apiKey: string,
  model = ,
  temperature = 0.7,
  systemPrompt = "You are Miso, a helpful and friendly AI assistant with a cheerful personality. You provide concise, accurate, and helpful responses.",
) {
  try {
    // Format messages 
    const formattedMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add system message at the beginning
    // Note: Gemini handles system messages differently, but will handle this appropriately
    const apiMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      ...formattedMessages,
    ]

    const response = await fetch( , {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin, // Required for 
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
      throw new Error(errorData.error?.message || "Failed to generate response")
    }

    const data: Response = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error("Error generating response:", error)
    throw error
  }
}

export async function processFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        resolve(event.target.result)
      } else {
        reject(new Error("Failed to read file content."))
      }
    }

    reader.onerror = () => {
      reject(new Error("Failed to read file."))
    }

    reader.readAsText(file)
  })
}

