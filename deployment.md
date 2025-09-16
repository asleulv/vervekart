🎯 VERVEKART DEPLOYMENT GUIDE - Komplett Git & Build Workflow

📋 DEPLOYMENT WORKFLOW OVERSIKT:
text
VS Code → Git Commit → GitHub → Server Pull → Build → Live Deploy
   ↓           ↓          ↓          ↓         ↓         ↓
 Lokal    Git Add    Push til   Pull på   npm run   Kopier til
  Kode   + Commit     GitHub     Server     build      LIVE/


💻 1. LOKAL UTVIKLING (VS Code)
Git Setup i VS Code:
bash
# Første gong - clone repo:
git clone https://github.com/yourusername/vervekart.git
cd vervekart/frontend

# Install dependencies:
npm install
Lokale Environment Filer:
bash
# .env.development
VITE_ADDRESSES_API_URL=http://localhost:3001
VITE_BACKEND_API_URL=http://localhost:3000/api

# .env.production 
VITE_ADDRESSES_API_URL=https://boligadresser.asle.dev
VITE_BACKEND_API_URL=https://vervekart.asle.dev/api


🔄 2. GIT WORKFLOW (VS Code til GitHub)
A) Stage & Commit i VS Code:
bash
# I VS Code terminal:
git status                    # Sjekk kva som er endra
git add .                     # Legg til alle endringar
git commit -m "Fix: Mobile-optimized TopBar with responsive design"
B) Eller bruk VS Code GUI:
Source Control panel (Ctrl+Shift+G)

Stage Changes (+) på filer du vil committe

Commit Message - skriv beskrivande melding

Commit (Ctrl+Enter)

C) Push til GitHub:
bash
git push origin master
Eller i VS Code: Ctrl+Shift+P → "Git: Push"


🚀 3. SERVER DEPLOYMENT
A) SSH til Server:
bash
ssh root@asle-server
cd /var/www/vervekart/frontend
B) Pull Latest Changes:
bash
git status                    # Sjekk om det er lokale endringar
git pull origin master       # Hent siste versjon frå GitHub
C) Install Dependencies (om nødvendig):
bash
npm install                   # Berre om package.json er endra


🔨 4. BUILD PROCESS
A) Production Build:
bash
cd /var/www/vervekart/frontend
NODE_ENV=production npm run build
Viktig: Build brukar .env.production automatisk!

B) Verify Build:
bash
ls -la dist/                  # Sjekk at dist/ mappe er laga
ls -la dist/assets/           # Sjekk at JS/CSS filer er der


📁 5. LIVE DEPLOYMENT
A) Backup (valgfritt):
bash
mv /var/www/vervekart/LIVE /var/www/vervekart/LIVE_backup_$(date +%Y%m%d_%H%M)
B) Deploy til LIVE:
bash
rm -rf /var/www/vervekart/LIVE/                    # Slett gammal versjon
mkdir -p /var/www/vervekart/LIVE                   # Lag ny mappe
cp -r dist/* /var/www/vervekart/LIVE/              # Kopier bygget innhald
C) Set Permissions:
bash
chown -R www-data:www-data /var/www/vervekart/LIVE/
chmod -R 755 /var/www/vervekart/LIVE/


⚡ 6. QUICK DEPLOYMENT SCRIPT
Lag script på server for raskare deployment:

bash
# Lag script:
nano /root/deploy-vervekart.sh

# Script innhald:
#!/bin/bash
echo "🚀 Deploying Vervekart..."
cd /var/www/vervekart/frontend

echo "📥 Pulling latest changes..."
git pull origin master

echo "🔨 Building..."
NODE_ENV=production npm run build

echo "📁 Deploying to LIVE..."
rm -rf /var/www/vervekart/LIVE/
mkdir -p /var/www/vervekart/LIVE
cp -r dist/* /var/www/vervekart/LIVE/
chown -R www-data:www-data /var/www/vervekart/LIVE/
chmod -R 755 /var/www/vervekart/LIVE/

echo "✅ Deployment complete!"
echo "🌐 Live at: https://vervekart.asle.dev"

# Gjer script kjørbart:
chmod +x /root/deploy-vervekart.sh
Bruk script:

bash
/root/deploy-vervekart.sh


🔍 7. DEBUGGING & TROUBLESHOOTING
A) Sjekk Build Errors:
bash
# Om build feiler:
npm run build 2>&1 | tee build.log      # Log output
cat build.log                           # Les feilmeldingar
B) Sjekk Environment Variables:
bash
# Sjekk at .env.production eksisterer:
cat .env.production

# Sjekk at variables er bygd inn:
grep -r "VITE_BACKEND_API_URL" /var/www/vervekart/LIVE/assets/
C) Test API Connections:
bash
# Test backend API:
curl https://vervekart.asle.dev/api/daily-stats

# Test address API:
curl https://boligadresser.asle.dev/api/health
D) Browser Testing:
Chrome DevTools → Network tab (sjekk 404s)

Console → sjekk JavaScript errors

Mobile View → test responsive design


📝 8. BEST PRACTICES
A) Commit Messages:
bash
# Gode commit messages:
git commit -m "Fix: Mobile ring animation positioning"
git commit -m "Add: Smart spacing for overlapping markers" 
git commit -m "Update: TopBar responsive design for iPad"
B) Branch Strategy (Optional):
bash
# For større features:
git checkout -b feature/mobile-optimization
# ... gjør endringar ...
git commit -m "Add mobile optimizations"
git push origin feature/mobile-optimization
# → Lag Pull Request på GitHub
C) Environment Management:
Aldri commit .env filer med secrets

Alltid sjekk at production URLs er riktige

Test lokalt før deployment


🎯 9. QUICK REFERENCE KOMMANDOER
Komplett Deployment (Ein kommando):
bash
cd /var/www/vervekart/frontend && git pull origin master && npm run build && rm -rf /var/www/vervekart/LIVE/ && mkdir -p /var/www/vervekart/LIVE && cp -r dist/* /var/www/vervekart/LIVE/ && echo "✅ Deployed!"
Git Status Check:
bash
git log --oneline -5          # Siste 5 commits
git status                    # Sjekk working directory
git diff                      # Sjekk endringar
Server Status:
bash
systemctl status nginx        # Sjekk webserver
pm2 status                    # Sjekk backend prosessar
df -h                         # Sjekk disk space
🎉 No har du fullstendig deployment workflow dokumentert!

Bookmark denne sida og bruk /root/deploy-vervekart.sh for rask deployment! 🚀