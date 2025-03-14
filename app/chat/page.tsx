import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import MisoAssistant from "@/components/miso-assistant"
import Footer from "@/components/footer"

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-background/50">
      <header className="container mx-auto max-w-7xl py-4 px-4 md:px-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <MisoAssistant />
      </main>

      <Footer />
    </div>
  )
}

