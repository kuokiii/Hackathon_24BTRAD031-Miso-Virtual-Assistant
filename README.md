# 🌸 Miso - Smart Virtual Assistant

<div align="center">
  
  
  A modern, intelligent virtual assistant with voice capabilities and smart home controls.
</div>

## ✨ Features

### 🎯 Core Features

- 🗣️ **Natural Language Understanding**: Chat naturally with Miso using text or voice
- 🔊 **Voice Recognition & Response**: Hands-free interaction with voice commands
- 🏠 **Smart Home Control**: Manage lights, thermostats, and other smart devices
- 🌤️ **Weather Updates**: Get current conditions and forecasts for any location
- 📰 **News Headlines**: Stay informed with the latest news from various categories
- 🎨 **Beautiful UI**: Modern, responsive design with dark mode support
- ⚡ **Real-time Responses**: Fast and efficient processing of requests

### 🛠️ Technical Features

- 🔄 **Server Components**: Built with Next.js 14 App Router
- 🎨 **Tailwind CSS**: Fully customizable styling with dark mode
- 🧩 **shadcn/ui**: Beautiful, accessible component system
- 🤖 **AI Integration**: Powered by advanced language models
- 🔐 **Type Safety**: Full TypeScript support
- 📱 **Responsive Design**: Works seamlessly on all devices

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/miso.git
cd miso
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Set Up Environment Variables
```bash
cp .env.example .env.local
```
Fill in your API keys and configuration values in `.env.local`.

### 4️⃣ Run the Development Server
```bash
npm run dev
```

**Open [http://localhost:3000](http://localhost:3000)**

Your Miso instance should now be running locally! 🎉

## 🎨 Customization

Miso is highly customizable:

- 🎯 **Theme**: Modify colors in `tailwind.config.ts`
- 🤖 **AI Model**: Change models in settings
- 🗣️ **Voice**: Adjust voice settings for TTS
- 🏠 **Smart Home**: Configure device integrations

## 📚 Documentation

For detailed documentation, check out:

- [Configuration Guide](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Smart Home Setup](docs/smart-home.md)
- [Voice Commands](docs/voice-commands.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👤 Author

**Nirupam Thapa (kuoki)**

- 📷 Instagram: [@_kuoki](https://instagram.com/_kuoki/)
- 💻 GitHub: [@kuokiii](https://github.com/kuokiii)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Acknowledgments

- Thanks to all contributors and users
- Built with [Next.js](https://nextjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

---

## 🚀 Deployment

To prepare the project for deployment:

### 1️⃣ Ensure all environment variables are properly configured in your Vercel project settings:
- `OPENROUTER_API_KEY`
- Any other API keys needed for weather and news services

### 2️⃣ Add a `vercel.json` configuration file:

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "regions": ["all"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3️⃣ Deploy to Vercel

You can deploy it to Vercel using one of these methods:

1. Connect your GitHub repository to Vercel for automatic deployments.
2. Use the Vercel CLI: `vercel`
3. Click the **Deploy with Vercel** button in the README.

The application will be deployed with all the necessary environment variables and configurations. Remember to:

- Set up the required environment variables in your Vercel project settings.
- Configure any additional services (weather API, news API) if needed.
- Test the deployment thoroughly after it's live.

---

### 🌟 **Made with ❤️ by Nirupam Thapa aka kuoki**

🔗 **Try Miso now**: [Miso - Smart Virtual Assistant](https://www.miso-ai.vercel.app)


