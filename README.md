<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4877d36a-0ad3-4fa6-a86d-319a9e23730d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

This project is ready to be deployed directly to [Vercel](https://vercel.com).

### Step-by-Step Deployment:

1. **Install Vercel CLI (optional)**:
   ```bash
   npm install -g vercel
   ```
2. **Deploy**:
   Run the following command in the project root:
   ```bash
   vercel
   ```
   Follow the prompts to link the project and deploy.

   Alternatively, import your Git repository (GitHub, GitLab, Bitbucket) directly in the Vercel Dashboard.

### Vercel Project Configuration:
- **Framework Preset**: Vite (detected automatically)
- **Build Command**: `npm run build` or `vite build`
- **Output Directory**: `dist`

