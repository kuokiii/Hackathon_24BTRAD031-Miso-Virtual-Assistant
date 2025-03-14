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

export class NewsService {
  private apiKey: string
  private baseUrl = ""

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  public async getTopHeadlines(country = "us", category?: string, pageSize = 5): Promise<NewsArticle[]> {
    try {
      let url = `${this.baseUrl}/top-headlines?country=${country}&pageSize=${pageSize}&apiKey=${this.apiKey}`

      if (category) {
        url += `&category=${category}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`News API error: ${response.statusText}`)
      }

      const data = await response.json()

      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || "No description available",
        url: article.url,
        urlToImage: article.urlToImage || "/placeholder.svg?height=200&width=300",
        source: {
          name: article.source.name || "Unknown Source",
        },
        publishedAt: new Date(article.publishedAt).toLocaleString(),
      }))
    } catch (error) {
      console.error("Error fetching news data:", error)
      throw error
    }
  }

  public async searchNews(query: string, pageSize = 5): Promise<NewsArticle[]> {
    try {
      const url = `${this.baseUrl}/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&apiKey=${this.apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`News API error: ${response.statusText}`)
      }

      const data = await response.json()

      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || "No description available",
        url: article.url,
        urlToImage: article.urlToImage || "/placeholder.svg?height=200&width=300",
        source: {
          name: article.source.name || "Unknown Source",
        },
        publishedAt: new Date(article.publishedAt).toLocaleString(),
      }))
    } catch (error) {
      console.error("Error searching news:", error)
      throw error
    }
  }

  public getAvailableCategories(): string[] {
    return ["business", "entertainment", "general", "health", "science", "sports", "technology"]
  }
}

// Update the newsService instance to use your API key
export const newsService = new NewsService("")

