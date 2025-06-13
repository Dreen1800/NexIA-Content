#!/bin/bash

# Script de Configuração SSL - NexIA Content
# Uso: ./setup-ssl.sh seu-dominio.com

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

# Definir domínio padrão ou usar parâmetro
DOMAIN=${1:-"content.nexialab.com.br"}

if [ -z "$1" ]; then
    log_info "Usando domínio padrão: $DOMAIN"
    log_warning "Para usar outro domínio: ./setup-ssl.sh seu-dominio.com"
else
    log_info "Configurando SSL para: $DOMAIN"
fi

# Verificar se está sendo executado como root
if [ "$EUID" -ne 0 ]; then 
    log_error "Execute como root (use sudo)"
    exit 1
fi

log_info "🔒 Configurando SSL para $DOMAIN..."

# Instalar Certbot
log_info "Instalando Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Verificar se o Nginx está funcionando
log_info "Verificando status do Nginx..."
if ! systemctl is-active --quiet nginx; then
    log_error "Nginx não está rodando. Inicie com: systemctl start nginx"
    exit 1
fi

# Obter certificado SSL
log_info "Obtendo certificado SSL do Let's Encrypt..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

if [ $? -eq 0 ]; then
    log_success "✅ Certificado SSL configurado com sucesso!"
    
    # Configurar renovação automática
    log_info "Configurando renovação automática..."
    crontab -l 2>/dev/null | grep -v certbot | crontab -
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_success "✅ Renovação automática configurada!"
    
    # Testar configuração
    log_info "Testando configuração do Nginx..."
    nginx -t && systemctl reload nginx
    
    log_success "🎉 SSL configurado com sucesso!"
    log_info "Seu site está disponível em: https://$DOMAIN"
    
else
    log_error "❌ Falha ao obter certificado SSL"
    log_warning "Verifique se:"
    echo "   1. O domínio $DOMAIN aponta para este servidor"
    echo "   2. As portas 80 e 443 estão abertas no firewall"
    echo "   3. O Nginx está servindo o site corretamente"
    exit 1
fi 