import requests

def get_news(api_key, query, language='en', page_size=10):
    url = 
    params = {
        'q': query,
        'language': language,
        'pageSize': page_size,
        'apiKey': 
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data.get('status') == 'ok':
        return data.get('articles', [])
    return []

def display_news(articles):
    for i, article in enumerate(articles, start=1):
        print(f"{i}. {article.get('title')}")
        print(f"   Source: {article.get('source', {}).get('name')}")
        print(f"   Published At: {article.get('publishedAt')}")
        print(f"   Description: {article.get('description')}")
        print(f"   URL: {article.get('url')}\n")

def main():
    API_KEY = 
    topics = ['technology', 'sports', 'politics', 'health', 'entertainment', 'science', 'business']
    language = 'en'
    articles_per_topic = 5
    for topic in topics:
        print(f"Fetching news for topic: {topic}")
        news_articles = get_news(API_KEY, topic, language, articles_per_topic)
        if news_articles:
            display_news(news_articles)
        else:
            print(f"No news found for topic: {topic}")
        print('-' * 80)

def fetch_all_news(api_key, topics, language='en', articles_per_topic=5):
    all_news = {}
    for topic in topics:
        news_articles = get_news(api_key, topic, language, articles_per_topic)
        all_news[topic] = news_articles
    return all_news

def save_news_to_file(news_data, filename='news.txt'):
    with open(filename, 'w', encoding='utf-8') as file:
        for topic, articles in news_data.items():
            file.write(f"Topic: {topic}\n")
            for i, article in enumerate(articles, start=1):
                file.write(f"{i}. {article.get('title')}\n")
                file.write(f"   Source: {article.get('source', {}).get('name')}\n")
                file.write(f"   Published At: {article.get('publishedAt')}\n")
                file.write(f"   Description: {article.get('description')}\n")
                file.write(f"   URL: {article.get('url')}\n\n")
            file.write('-' * 80 + '\n')

def load_news_from_file(filename='news.txt'):
    with open(filename, 'r', encoding='utf-8') as file:
        return file.read()

def fetch_and_save_news(api_key, topics, filename='news.txt'):
    news_data = fetch_all_news(api_key, topics)
    save_news_to_file(news_data, filename)
    print(f"News saved to {filename}")

def search_news_in_file(keyword, filename='news.txt'):
    with open(filename, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    found_articles = []
    for i, line in enumerate(lines):
        if keyword.lower() in line.lower():
            found_articles.append(''.join(lines[i-2:i+4]))
    return '\n'.join(found_articles)

def fetch_news_by_date(api_key, query, from_date, to_date, language='en', page_size=10):
    url = 
    params = {
        'q': query,
        'from': from_date,
        'to': to_date,
        'language': language,
        'pageSize': page_size,
        'apiKey': api_key
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data.get('status') == 'ok':
        return data.get('articles', [])
    return []

def filter_news_by_source(articles, source_name):
    return [article for article in articles if article.get('source', {}).get('name') == source_name]

def interactive_news_search(api_key, topics):
    while True:
        query = input("Enter a topic (or 'exit' to quit): ")
        if query.lower() == 'exit':
            break
        articles = get_news(api_key, query)
        display_news(articles)

def fetch_news_sorted(api_key, query, sort_by='publishedAt', language='en', page_size=10):
    url = 
    params = {
        'q': query,
        'language': language,
        'sortBy': sort_by,
        'pageSize': page_size,
        'apiKey': api_key
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data.get('status') == 'ok':
        return data.get('articles', [])
    return []

def display_summary(articles):
    for article in articles:
        print(f"Title: {article.get('title')}")
        print(f"Summary: {article.get('description')}\n")

def fetch_and_summarize_news(api_key, query, page_size=5):
    articles = get_news(api_key, query, page_size=page_size)
    display_summary(articles)

def fetch_news_with_keywords(api_key, keywords, language='en', page_size=10):
    all_articles = []
    for keyword in keywords:
        articles = get_news(api_key, keyword, language, page_size)
        all_articles.extend(articles)
    return all_articles

def news_cli():
    API_KEY = ''
    topics = ['technology', 'sports', 'politics', 'health', 'entertainment']
    while True:
        print("1. Fetch News\n2. Save News\n3. Load News\n4. Search News\n5. Exit")
        choice = input("Choose an option: ")
        if choice == '1':
            fetch_and_save_news(API_KEY, topics)
        elif choice == '2':
            save_news_to_file(fetch_all_news(API_KEY, topics))
        elif choice == '3':
            print(load_news_from_file())
        elif choice == '4':
            keyword = input("Enter a keyword: ")
            print(search_news_in_file(keyword))
        elif choice == '5':
            break
        else:
            print("Invalid choice")
