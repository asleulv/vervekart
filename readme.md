# 🗺️ Vervekart - Intelligent Address Mapping System

**Vervekart** er eit avansert kartleggingsverkty for dørbank og addressebasert kampanjar. Systemet kombinerer OpenStreetMap-visualisering med smart status-tracking og optimalisert ytelse for mobil bruk.

## 🚀 Funksjonar

### 📍 **Smart Markør System**
- **Zoom-basert filtering**: Markørar visest progressivt (zoom 15-17+)
- **Status-baserte fargar**: Ja (grøn), Nei (raud), Ikke hjemme (gul), Ubehandlet (blå)
- **Ring-eksplosjon animasjon** for "Ja"-status
- **Adresse-hover** med detaljert informasjon

### 🏠 **Bustad-klassifisering**
- **Enebolig vs Flerbolig** automatisk deteksjon
- **Etasje-gruppering** for leilegheiter og blokker
- **Smart popup-layout** med strukturert informasjon

### ⚡ **Performance-optimalisering**
- **2000+ adresser** håndtert effektivt
- **Debounced API-kallar** (300ms)
- **Progressive loading** basert på zoom-nivå
- **Mobil-optimalisert** med touch-støtte

### 📊 **Backend Funksjoner**
- **SQLite database** for brukarar og status-tracking
- **Full historikk** av alle statusendringar
- **Statistikk API** (dagens og total aktivitet)
- **Bulk reset** av områder med logging
- **CORS-konfigurasjon** for sikker frontend-kommunikasjon

## 🏗️ Arkitektur
vervekart/
├── frontend/ # React + Vite frontend
│ ├── src/
│ │ ├── components/ # React komponenter
│ │ ├── services/ # API-tjeneseter
│ │ └── utils/ # Hjelpefunksjonar
│ ├── .env # Environment variablar
│ ├── .env.production # Production konfigurasjon
│ └── package.json # Dependencies
├── backend/ # Node.js + Express API
│ ├── .env # Environment konfigurasjon
│ ├── server.js # Hovud API server
│ ├── database.js # SQLite database setup
│ └── package.json # Dependencies
└── README.md # Denne fila


## 📡 API Integrasjon

### **Eksterne API:**
- **boligadresser.asle.dev**: PostgreSQL med alle norske adresser
- **OpenStreetMap**: Tile-server for kart-visualisering

### **Interne API:**
- **Status API**: Lagring og henting av dørbank-status
- **Brukar API**: Registrering og brukarstyre
- **Statistikk API**: Rapportar og analyser

## ⚙️ Installasjon

### **1. Klon Repository**
git clone [repository-url]
cd vervekart

### **2. Backend Setup**
cd backend
npm install

Opprett .env med konfigurasjon:
MODE=development
PORT=3099
DEV_NODE_ENV=development
DEV_SQLITE_PATH=./vervekart.db
DEV_FRONTEND_URL=http://localhost:5173
PROD_NODE_ENV=production
PROD_SQLITE_PATH=/var/www/vervekart-api/vervekart.db
PROD_FRONTEND_URL=https://vervekart.asle.dev
npm start

### **3. Frontend Setup**
cd frontend
npm install

Opprett .env med API URLs:
VITE_BACKEND_API_URL=http://localhost:3099/api
VITE_ADDRESSES_API_URL=https://boligadresser.asle.dev
npm run dev

## 🚀 Deployment

### **Development vs Production**

**Environment switching gjer via MODE-variabel i backend/.env:**
Development
MODE=development

Production
MODE=production

### **Production Deployment**

**1. Bygg Frontend:**
cd frontend
npm run build # Brukar .env.production automatisk

**2. Deploy til Server:**
Kopier build
scp -i ~/.ssh/key -r frontend/dist/* root@server:/var/www/vervekart/

Kopier backend
scp -i ~/.ssh/key -r backend/ root@server:/var/www/vervekart-api/

**3. Server Setup:**
Backend
cd /var/www/vervekart-api
npm install

Endre MODE=production i .env
pm2 start server.js --name vervekart-api

Nginx config for frontend
server {
listen 80;
server_name vervekart.asle.dev;
root /var/www/vervekart;
index index.html;
location / {
    try_files $uri $uri/ /index.html;
}
}


## 🗄️ Database Schema

### **SQLite Tabellar:**

**users**: Brukar-registrering og autentisering
**address_current_status**: Noverande status per adresse  
**address_history**: Full historikk av alle endringar
**reset_log**: Logging av bulk-operasjonar

## 📱 Mobil Optimalisering

- **Touch-vennleg interface** med responsive design
- **Performance-testing** på 4G nettverk
- **Zoom-basert markør-loading** for rask respons
- **Offline-robust** med graceful error handling

## 🛠️ Teknologi Stack

### **Frontend:**
- **React 18** med hooks og modern state management
- **Vite** for rask utvikling og build
- **Leaflet** for OpenStreetMap integration
- **CSS3** med responsive design

### **Backend:**
- **Node.js + Express** for API server
- **SQLite3** for lokal data-lagring  
- **CORS** for sikker cross-origin kommunikasjon
- **dotenv** for environment management

### **Infrastructure:**
- **Nginx** for static file serving
- **PM2** for process management
- **SSL/HTTPS** for sikker kommunikasjon
- **Ubuntu Server** hosting

## 🔧 Konfigurasjonseksempel

### **frontend/.env.production:**
VITE_BACKEND_API_URL=https://api.vervekart.asle.dev
VITE_ADDRESSES_API_URL=https://boligadresser.asle.dev


### **backend/.env (production):**
MODE=production
PORT=3099
DEV_NODE_ENV=development
DEV_SQLITE_PATH=./vervekart.db
DEV_FRONTEND_URL=http://localhost:5173
PROD_NODE_ENV=production
PROD_SQLITE_PATH=/var/www/vervekart-api/vervekart.db
PROD_FRONTEND_URL=https://vervekart.asle.dev

## 📊 API Endpoints
POST /api/register-user # Brukar-registrering
POST /api/save-status # Lagre adresse-status
POST /api/get-statuses # Hent alle statusar
GET /api/address-history/:id # Historikk for adresse
GET /api/daily-stats # Dagens aktivitet
GET /api/advanced-stats # Total statistikk
DELETE /api/clear-area # Nullstill område


## 👥 Brukarreidar

**Navigasjon**: Zoom/pan med mus eller touch
**Markør-klikk**: Vis adresse-detaljar og status-val
**Status-endring**: Klikk "Ja/Nei/Ikke hjemme" for å logge resultat
**Historikk**: Sjå alle endringar per adresse
**Statistikk**: Dagleg og total oversikt over aktivitet

## 🎯 Neste Steg

1. **Test lokalt** med `npm run dev` (frontend) og `npm start` (backend)
2. **Bygg for production** med `npm run build` 
3. **Deploy til server** med scp/rsync
4. **Sett opp nginx** og SSL-sertifikat
5. **Test på mobil** med 4G for real-world performance

---

**Versjon**: 1.0  
**Sist oppdatert**: September 2025  
**Utviklar**: Asle (@frokedal)







