# Neon Beat Playlist Creator

A modern web application for creating and managing YouTube playlists with a neon-themed UI. Built with React, TypeScript, Vite, and Ant Design.

## 🚀 Features

- **YouTube API Integration**: Browse and manage YouTube playlists using Google API
- **Modern UI**: Dark-themed interface with Ant Design components
- **Responsive Design**: Mobile-friendly layout with Tailwind CSS
- **Hash-based Routing**: Optimized for GitHub Pages deployment
- **Type-Safe**: Full TypeScript support

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **npm** (comes with Node.js)
- **Git**

## 🛠️ Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/neon-beat/neon-beat-playlist-creator.git
cd neon-beat-playlist-creator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GOOGLE_API_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_GOOGLE_REDIRECT_URI="http://localhost:5173"
```

**How to get Google API credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**
4. Create credentials:
   - **API Key**: For public API access
   - **OAuth 2.0 Client ID**: For user authentication
5. Add authorized redirect uris:
   - `http://localhost:5173` (for local development)
   - `https://neon-beat.github.io` (for production)

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
neon-beat-playlist-creator/
├── public/                 # Static assets
│   └── images/            # Images and logos
├── src/
│   ├── Components/        # React components
│   │   ├── Home.tsx
│   │   ├── PlaylistList.tsx
│   │   ├── PlaylistViewer.tsx
│   │   └── Sidebar.tsx
│   ├── Context/           # React context providers
│   │   └── MessageContext.tsx
│   ├── Hooks/             # Custom React hooks
│   │   └── useGoogleApi.tsx
│   ├── assets/            # Component-specific assets
│   ├── App.tsx            # Main app component
│   ├── App.css            # Global styles
│   ├── main.tsx           # App entry point
│   └── index.css          # Tailwind directives
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│       └── vite.yml       # Deployment workflow
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json           # Dependencies and scripts
```

## 🎨 Tech Stack

- **React 19**: UI framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Ant Design**: UI component library
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Hash-based routing for SPA
- **Google API**: YouTube Data API integration

## 📝 Available Scripts

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
```

## 🔧 Configuration

### Vite Configuration

The app is configured for GitHub Pages deployment with:
- Base path: `/neon-beat-playlist-creator`
- Source maps enabled for debugging
- React plugin with Fast Refresh

### Routing

The app uses `HashRouter` from React Router for GitHub Pages compatibility:
- Routes are prefixed with `#` (e.g., `/#/playlists`)
- No server-side configuration needed

### Styling

- **Ant Design**: Dark theme with custom primary color (#9E339F)
- **Tailwind CSS**: Utility classes for rapid development
- **Custom CSS**: Component-specific styles with `!important` for overrides

## 🚀 Deployment

The app is automatically deployed to GitHub Pages when you push to the `main` branch.

### Manual Deployment

```bash
npm run build
# The dist/ folder is ready for deployment
```

### GitHub Actions Workflow

The deployment workflow:
1. Checks out the code
2. Sets up Node.js with caching
3. Installs dependencies
4. Builds the app with environment variables from GitHub Secrets
5. Deploys to GitHub Pages

**Required GitHub Secrets:**
- `VITE_GOOGLE_API_CLIENT_ID`
- `VITE_GOOGLE_API_KEY`

## 🔒 Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the app:

```typescript
// Access in your code
const clientId = import.meta.env.VITE_GOOGLE_API_CLIENT_ID;
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [React](https://react.dev/) - A JavaScript library for building user interfaces
- [Ant Design](https://ant.design/) - A design system for enterprise-level products
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
