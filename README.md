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

## 🚢 DigitalOcean Deployment Guide

Since DebugFlow is a React SPA built with Vite, it compiles down to static HTML, CSS, and JS assets (`/dist` directory). Here are two options to deploy it on DigitalOcean.

### Option A: Static Site App Platform (Easiest & PaaS)
This builds and deploys your frontend directly from a Git branch, providing free SSL out-of-the-box.

1. Push your repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to the **DigitalOcean Control Panel**, click **Apps**, and click **Create App**.
3. Choose your Git repository source and select the branch you want to deploy.
4. Set the following Build settings:
   * **Build Command**: `npm run build`
   * **Publish Directory**: `dist`
5. In the **Environment Variables** section, add your environment variables:
   * Set all `VITE_` keys (Firebase, Groq, OnlineCompiler) exactly as they are defined in your local `.env`.
6. Click **Next** and click **Create Resources** to launch the deployment.

---

### Option B: Deploying on a DigitalOcean Droplet (Nginx Web Server)
Use this option if you want to deploy onto an existing Linux server (Ubuntu/Debian) running Nginx.

#### 1. Setup Server & Nginx
SSH into your DigitalOcean Droplet:
```bash
ssh root@your_droplet_ip
sudo apt update
sudo apt install nginx -y
```

#### 2. Copy the Build Assets to your Droplet
First, compile the application locally:
```bash
npm run build
```
This outputs all assets to the `dist/` directory.

Use `scp` or `rsync` to upload the folder contents directly to your Droplet's web root:
```bash
rsync -avzP dist/ root@your_droplet_ip:/var/www/html/
```

#### 3. Configure Nginx for React Router Routing
Open the Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/default
```

Replace the contents of the `location /` block to ensure all requests route back to `index.html` (which is necessary for React Router's client-side routing):
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/html;
    index index.html index.htm;

    server_name your_domain.com www.your_domain.com;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression for better performance
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
}
```

Save the file and verify the configuration:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Configure HTTPS (SSL) with Let's Encrypt
To secure your connections and credentials, install Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com -d www.your_domain.com
```
Follow the interactive prompts to enable SSL redirection.
