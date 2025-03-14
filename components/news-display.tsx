"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  source: {
    name: string
  }
  publishedAt: string
}

interface NewsDisplayProps {
  articles: NewsArticle[]
  category?: string
  searchQuery?: string
  onClose?: () => void
}

export default function NewsDisplay({ articles, category, searchQuery, onClose }: NewsDisplayProps) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden">
      <Tabs defaultValue="headlines">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="headlines">Headlines</TabsTrigger>
          <TabsTrigger value="article" disabled={!selectedArticle}>
            Full Article
          </TabsTrigger>
        </TabsList>

        <TabsContent value="headlines" className="p-0">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {searchQuery
                ? `News about "${searchQuery}"`
                : `${category ? category.charAt(0).toUpperCase() + category.slice(1) : "Latest"} Headlines`}
            </h3>

            <div className="space-y-4">
              {articles.map((article, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-4 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setSelectedArticle(article)}
                >
                  {article.urlToImage && (
                    <div className="sm:w-1/4 flex-shrink-0">
                      <img
                        src={article.urlToImage || "/placeholder.svg"}
                        alt={article.title}
                        className="w-full h-24 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-medium line-clamp-2">{article.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.source.name} • {new Date(article.publishedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="article" className="p-0">
          {selectedArticle && (
            <CardContent className="p-6">
              <Button variant="ghost" size="sm" className="mb-4" onClick={() => setSelectedArticle(null)}>
                ← Back to headlines
              </Button>

              <h3 className="text-xl font-semibold mb-2">{selectedArticle.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedArticle.source.name} • {new Date(selectedArticle.publishedAt).toLocaleString()}
              </p>

              {selectedArticle.urlToImage && (
                <img
                  src={selectedArticle.urlToImage || "/placeholder.svg"}
                  alt={selectedArticle.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                  }}
                />
              )}

              <p className="mb-4">{selectedArticle.description}</p>

              <a
                href={selectedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:underline"
              >
                Read full article <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </CardContent>
          )}
        </TabsContent>
      </Tabs>

      <div className="p-4 border-t border-primary/10">
        <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
          Back to Chat
        </Button>
      </div>
    </Card>
  )
}

