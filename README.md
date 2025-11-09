# Ortho Mock Portal

A modern React application built with Vite, TypeScript, and shadcn/ui components.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn or pnpm
- Git

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/bilalkhantanoli/ortho_doc.git
   cd ortho-mock-portal-main
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```
   or
   ```bash
   pnpm install
   ```

## Run

### Development Server

Start the development server:
```bash
npm run dev
```
or
```bash
yarn dev
```
or
```bash
pnpm dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

### Build

Build for production:
```bash
npm run build
```

Build for development:
```bash
npm run build:dev
```

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Lint

Run ESLint to check code quality:
```bash
npm run lint
```

## Git Workflow

### Pushing Code

1. **Check your current remote:**
   ```bash
   git remote -v
   ```

2. **If you need to authenticate, use one of these methods:**

   **Option A: Use SSH (Recommended)**
   - Generate an SSH key if you don't have one:
     ```bash
     ssh-keygen -t ed25519 -C "your_email@example.com"
     ```
   - Add your SSH key to GitHub (Settings → SSH and GPG keys)
   - Change remote URL to SSH:
     ```bash
     git remote set-url origin git@github.com:bilalkhantanoli/ortho_doc.git
     ```

   **Option B: Use Personal Access Token**
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` permissions
   - When pushing, use the token as password:
     ```bash
     git push -u origin main
     ```
     (Username: `bilalkhantanoli`, Password: `your_token`)

   **Option C: Update Git Credentials**
   - Update your Git credentials:
     ```bash
     git config --global user.name "bilalkhantanoli"
     git config --global user.email "your_email@example.com"
     ```
   - Clear cached credentials:
     ```bash
     git credential-manager-core erase
     ```
     (Windows) or
     ```bash
     git credential reject https://github.com
     ```

3. **Standard push workflow:**
   ```bash
   # Check status
   git status
   
   # Add changes
   git add .
   
   # Commit changes
   git commit -m "Your commit message"
   
   # Push to remote
   git push -u origin main
   ```

### Troubleshooting Permission Issues

If you get a `403 Permission denied` error:
- Make sure you're authenticated with the correct GitHub account (`bilalkhantanoli`)
- Check if you have write access to the repository
- Try using SSH instead of HTTPS
- Verify your credentials are correct

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Data fetching
- **Zustand** - State management
