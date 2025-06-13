#!/bin/bash

# Script de Setup Inicial - NexIA Content
# Domínio: content.nexialab.com.br
# Diretório: /www/nexia-content

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está sendo executado como root
if [ "$EUID" -ne 0 ]; then 
    log_error "Execute como root (use sudo)"
    exit 1
fi

# Variáveis de configuração
DOMAIN="content.nexialab.com.br"
PROJECT_DIR="/www/nexia-content"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

log_info "🚀 Configurando NexIA Content para $DOMAIN..."

# Criar diretório do projeto
log_info "Criando diretório $PROJECT_DIR..."
mkdir -p /www
cd /www

# Parar PM2 se estiver rodando
log_info "Parando processos PM2 existentes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Remover diretório existente se houver
if [ -d "$PROJECT_DIR" ]; then
    log_warning "Removendo diretório existente..."
    rm -rf "$PROJECT_DIR"
fi

# Clonar repositório
log_info "Clonando repositório do GitHub..."
git clone https://github.com/Dreen1800/NexIA-Content.git nexia-content
cd nexia-content

# Configurar permissões
log_info "Configurando permissões..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Criar arquivo de ambiente
log_info "Criando arquivo de ambiente (.env)..."
cat > .env << EOL
NODE_ENV=production
VITE_SUPABASE_URL=https://sua-url-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
PORT=3001
VITE_APP_DOMAIN=https://$DOMAIN
VITE_APP_ENV=production
EOL

log_warning "⚠️  EDITE o arquivo .env com suas credenciais do Supabase!"

# Instalar dependências
log_info "Instalando dependências do projeto..."
npm install

# Instalar dependências do proxy
log_info "Instalando dependências do servidor proxy..."
npm install express http-proxy-middleware cors node-fetch@2.6.7

# Build da aplicação
log_info "Construindo aplicação para produção..."
npm run build

# Configurar Nginx
log_info "Configurando Nginx para $DOMAIN..."

# Criar configuração específica do Nginx
cat > $NGINX_SITES_AVAILABLE/nexia-content << EOL
# Upstream para o servidor proxy Node.js
upstream instagram_proxy {
    server 127.0.0.1:3001;
}

# Configuração HTTP (redirecionamento para HTTPS)
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirecionar todo tráfego HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

# Configuração HTTPS principal
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # Diretório root da aplicação
    root $PROJECT_DIR/dist;
    index index.html;

    # Logs específicos
    access_log /var/log/nginx/nexia-content-access.log;
    error_log /var/log/nginx/nexia-content-error.log;

    # Configurações SSL (serão configuradas pelo certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # === PROXY ENDPOINTS ===
    
    # Proxy para imagens do Instagram (via Node.js)
    location /instagram-proxy/ {
        proxy_pass http://instagram_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings para imagens
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Headers CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }

    # API proxy dinâmico (via Node.js)
    location /api/instagram-proxy {
        proxy_pass http://instagram_proxy;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range' always;
    }

    # Health check do proxy
    location /health {
        proxy_pass http://instagram_proxy;
        access_log off;
    }

    # === APLICAÇÃO REACT ===
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
        
        # Compressão
        gzip_static on;
    }

    # Servir aplicação React (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Headers para SPA
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Bloquear acesso a arquivos sensíveis
    location ~ /\.(env|git) {
        deny all;
        return 404;
    }
}
EOL

# Habilitar site no Nginx
log_info "Habilitando site no Nginx..."
ln -sf $NGINX_SITES_AVAILABLE/nexia-content $NGINX_SITES_ENABLED/
rm -f $NGINX_SITES_ENABLED/default

# Testar configuração do Nginx
log_info "Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    log_success "✅ Configuração do Nginx válida!"
    systemctl reload nginx
else
    log_error "❌ Erro na configuração do Nginx!"
    exit 1
fi

# Iniciar aplicação com PM2
log_info "Iniciando servidor proxy com PM2..."
pm2 start ecosystem.config.js

# Salvar configuração do PM2
log_info "Salvando configuração do PM2..."
pm2 save
pm2 startup

log_success "🎉 Setup inicial concluído!"
log_info "📋 Próximos passos:"
echo ""
echo "   1. ✏️  Edite o arquivo .env: nano $PROJECT_DIR/.env"
echo "   2. 🔒 Configure SSL: ./setup-ssl.sh $DOMAIN"
echo "   3. 🔄 Configure atualizações automáticas: ./setup-auto-update.sh"
echo ""
log_info "📊 Status atual dos serviços:"
pm2 status
echo ""
systemctl status nginx --no-pager -l 