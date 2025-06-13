#!/bin/bash

# Script de Deploy Automatizado - NexIA Content
# Uso: ./deploy-vps.sh

set -e

echo "🚀 Iniciando deploy do NexIA Content na VPS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logs coloridos
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

# Definir variáveis
PROJECT_DIR="/var/www/NexIA-Content"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

log_info "Parando serviços existentes..."
pm2 stop all || true

log_info "Atualizando código do repositório..."
cd $PROJECT_DIR
git pull origin main

log_info "Criando arquivo de ambiente de produção..."
cat > .env << EOL
NODE_ENV=production
VITE_SUPABASE_URL=https://sua-url-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
PORT=3001
VITE_APP_DOMAIN=https://seu-dominio.com
VITE_APP_ENV=production
EOL

log_warning "⚠️  IMPORTANTE: Edite o arquivo .env com suas credenciais reais!"

log_info "Instalando dependências da aplicação principal..."
npm install

log_info "Instalando dependências do servidor proxy..."
npm install --prefix . -f express http-proxy-middleware cors node-fetch@2.6.7

log_info "Construindo aplicação para produção..."
npm run build

log_info "Configurando permissões..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

log_info "Configurando Nginx..."
cp nginx-full-config.conf $NGINX_SITES_AVAILABLE/nexia-content

# Atualizar configuração com domínio correto
log_warning "⚠️  Lembre-se de alterar 'seu-dominio.com' no arquivo de configuração!"

# Habilitar site
ln -sf $NGINX_SITES_AVAILABLE/nexia-content $NGINX_SITES_ENABLED/
rm -f $NGINX_SITES_ENABLED/default

log_info "Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    log_success "Configuração do Nginx válida!"
    systemctl reload nginx
else
    log_error "Erro na configuração do Nginx!"
    exit 1
fi

log_info "Iniciando servidor proxy com PM2..."
pm2 start ecosystem.config.js

log_info "Salvando configuração do PM2..."
pm2 save
pm2 startup

log_success "✅ Deploy concluído!"
log_info "📋 Próximos passos:"
echo "   1. Edite /var/www/NexIA-Content/.env com suas credenciais"
echo "   2. Altere 'seu-dominio.com' em /etc/nginx/sites-available/nexia-content"
echo "   3. Configure SSL com certbot (opcional)"
echo "   4. Reinicie os serviços: pm2 restart all && systemctl reload nginx"

log_info "📊 Status dos serviços:"
pm2 status
systemctl status nginx --no-pager 