# VidCore Search

A modern Single Page Application for searching movies and TV shows, getting their IMDb IDs, and streaming them via VidCore.

## Features

- 🔍 **Search** - Search for any movie or TV show using the IMDb API
- 🎬 **Movie Streaming** - Stream movies directly with the VidCore player
- 📺 **TV Show Support** - Select seasons and episodes for TV series
- 🎨 **Modern UI** - Beautiful, responsive design with TailwindCSS
- ⚡ **Fast** - Built with React and Vite for optimal performance

## Tech Stack

- React 18
- Vite
- TailwindCSS
- Lucide React Icons

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to GitHub Pages

1. Create a new GitHub repository named `vidcore-wrapper`
2. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://YOUR_USERNAME.github.io/vidcore-wrapper"
   ```
3. Push your code to GitHub
4. Run the deploy command:
   ```bash
   npm run deploy
   ```
5. Your app will be available at `https://YOUR_USERNAME.github.io/vidcore-wrapper`

**Note:** The `base` path in `vite.config.js` is already set to `/vidcore-wrapper/` for GitHub Pages deployment. If you use a different repository name, update this path accordingly.

## API

This app uses:
- [IMDb API](https://imdb.iamidiotareyoutoo.com/docs/index.html) for search
- [VidCore](https://vidcore.net) for streaming

## Usage

1. Enter a movie or TV show name in the search bar
2. Browse the results with posters and metadata
3. Click on any result to open the VidCore player
4. For TV shows, select the season and episode you want to watch
