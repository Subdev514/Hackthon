# DebugFlow 🚀

DebugFlow is a modern, premium real-time collaborative coding and live debugging workspace. It allows developers to collaborate instantly inside private, password-protected rooms, chat with teammates, compile and execute programs across multiple languages, and use integrated AI models to analyze and troubleshoot code errors.

---

## 🌟 Key Features

*   **Real-time Collaborative Editing**: Write code simultaneously with team members in multiple virtual channels.
*   **Multi-Language Compilation**: Execute code instantly in **C**, **C++**, **Python**, **Java**, **JavaScript**, and **Go** using the sandboxed OnlineCompiler.io execution engine.
*   **AI Debugger**: Query advanced AI models (via Groq API) directly inside the workspace to locate and resolve runtime exceptions.
*   **Dynamic Resizable Panels**: Customize your coding view by dragging the edges of the navigation sidebar and chat panel to find your perfect layout.
*   **Password Protected Rooms**: Secure your collaborative spaces with optional room-level password restrictions.
*   **Team Presence**: Real-time typing indicators and active member lists show who is working in the room.

---

## 🛠️ Local Development Setup

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) (installed automatically with Node.js)

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd Hackthon
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory based on `.env.example`:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID

# AI Debugger (Groq API Key)
VITE_GROQ_API_KEY=YOUR_GROQ_API_KEY

# OnlineCompiler.io REST API Token
VITE_ONLINECOMPILER_API_KEY=YOUR_ONLINECOMPILER_API_KEY
```

### 3. Run Locally
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

---

## 🚢 Production Deployment Guide

Since DebugFlow is a React Single Page Application (SPA) built with Vite, it compiles down to static HTML, CSS, and JS assets (`/dist` directory). Here are three generic ways to deploy the application in production.

### Option 1: Static Hosting (Netlify, Vercel, Cloudflare Pages, GitHub Pages)
This is the easiest and most performant way to host the application, as it serves static assets from a CDN.

1. Push your repository to a Git provider (GitHub, GitLab, Bitbucket).
2. Create a new site on your chosen hosting platform and link it to your repository.
3. Configure the build settings:
   * **Build Command**: `npm run build`
   * **Publish/Output Directory**: `dist`
4. Set the required environment variables:
   * Set all `VITE_` variables (Firebase, Groq, OnlineCompiler API keys) in the platform's Environment Variables settings panel.
5. Deploy. The platform will automatically build your site and configure HTTPS.

---

### Option 2: Web Service Deployment (Render, Heroku, DigitalOcean App Platform, etc.)
If your deployment platform runs the application as a Docker/Node container web service instead of a static site:

1. The platform will run `npm run build` followed by `npm start`.
2. A `"start"` script has been configured in `package.json` that runs the Vite preview server on port `8080` (listening on all interfaces `0.0.0.0`):
   ```bash
   npm run start
   ```
3. Set your service's internal port or health check port to `8080`.
4. Ensure all your `VITE_` environment variables are added to the service configuration.

---

### Option 3: VPS / Virtual Machine (Nginx Web Server)
Use this option if you want to deploy onto a custom virtual private server running Nginx.

#### 1. Setup Nginx
SSH into your server and install Nginx:
```bash
sudo apt update
sudo apt install nginx -y
```

#### 2. Build and Transfer Assets
Compile the production build locally:
```bash
npm run build
```
This generates the static assets inside the `dist/` directory. Copy the contents of the `dist/` folder to the server's web root (e.g., `/var/www/html/`):
```bash
rsync -avzP dist/ user@your_server_ip:/var/www/html/
```

#### 3. Configure Nginx with SPA Routing fallback
Open your Nginx server block configuration (usually `/etc/nginx/sites-available/default`):
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm;

    server_name your_domain.com www.your_domain.com;

    location / {
        # Ensure React Router client-side routes fallback to index.html
        try_files $uri $uri/ /index.html;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```
Validate the syntax and reload Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Configure SSL/HTTPS
Install Certbot to set up free SSL certificates (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```
