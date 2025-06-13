#!/bin/bash

# Script de Configuração de Atualizações Automáticas - NexIA Content
# Configura webhook e cronjob para atualizações automáticas

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
PROJECT_DIR="/www/nexia-content"
SCRIPTS_DIR="/opt/nexia-scripts"

log_info "🔄 Configurando sistema de atualizações automáticas..."

# Criar diretório para scripts
mkdir -p $SCRIPTS_DIR

# Criar script de atualização principal
log_info "Criando script de atualização..."
cat > $SCRIPTS_DIR/update-nexia.sh << 'EOL'
#!/bin/bash

# Script de Atualização Automática - NexIA Content
# Executa pull do GitHub, rebuild e restart dos serviços

set -e

# Cores para logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Variáveis
PROJECT_DIR="/www/nexia-content"
LOG_FILE="/var/log/nexia-updates.log"
BACKUP_DIR="/tmp/nexia-backup-$(date +%Y%m%d-%H%M%S)"

# Função para logging
log_to_file() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> $LOG_FILE
}

# Função de cleanup em caso de erro
cleanup_on_error() {
    log_error "Erro durante atualização. Restaurando backup..."
    log_to_file "ERROR: Falha na atualização - restaurando backup de $BACKUP_DIR"
    
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf $PROJECT_DIR
        mv $BACKUP_DIR $PROJECT_DIR
        chown -R www-data:www-data $PROJECT_DIR
        
        # Reiniciar serviços
        pm2 restart all
        systemctl reload nginx
        
        log_warning "Backup restaurado com sucesso"
        log_to_file "SUCCESS: Backup restaurado"
    fi
    exit 1
}

# Trap para capturar erros
trap cleanup_on_error ERR

log_info "🔄 Iniciando atualização automática do NexIA Content..."
log_to_file "INFO: Iniciando processo de atualização"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    log_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    log_to_file "ERROR: Diretório do projeto não encontrado"
    exit 1
fi

cd $PROJECT_DIR

# Verificar se há mudanças no repositório remoto
log_info "Verificando atualizações no GitHub..."
git fetch origin main

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    log_info "✅ Repositório já está atualizado. Nenhuma ação necessária."
    log_to_file "INFO: Nenhuma atualização disponível"
    exit 0
fi

log_info "📦 Nova versão disponível. Iniciando processo de atualização..."
log_to_file "INFO: Nova versão detectada - $REMOTE_HASH"

# Criar backup do diretório atual
log_info "Criando backup do estado atual..."
cp -r $PROJECT_DIR $BACKUP_DIR
log_to_file "INFO: Backup criado em $BACKUP_DIR"

# Parar serviços temporariamente
log_info "Parando serviços..."
pm2 stop all

# Fazer backup do arquivo .env
cp .env /tmp/nexia-env-backup

# Atualizar código do GitHub
log_info "Atualizando código do GitHub..."
git reset --hard origin/main
git pull origin main

# Restaurar arquivo .env
cp /tmp/nexia-env-backup .env
rm /tmp/nexia-env-backup

# Limpar caches antigos
log_info "🧹 Limpando caches..."

# Limpar cache do npm
npm cache clean --force

# Limpar node_modules e reinstalar (se necessário)
if [ -f "package-lock.json" ]; then
    PACKAGE_CHANGED=$(git diff --name-only HEAD~1 HEAD | grep -E "(package\.json|package-lock\.json)" || true)
    if [ ! -z "$PACKAGE_CHANGED" ]; then
        log_info "Dependências alteradas. Reinstalando..."
        rm -rf node_modules
        npm install
    fi
else
    log_info "Instalando/atualizando dependências..."
    npm install
fi

# Limpar build anterior
log_info "Removendo build anterior..."
rm -rf dist

# Fazer novo build
log_info "🔨 Construindo nova versão..."
npm run build

# Limpar cache do Nginx
log_info "Limpando cache do Nginx..."
if [ -d "/var/cache/nginx" ]; then
    rm -rf /var/cache/nginx/*
fi

# Limpar cache do navegador (force reload)
find dist -name "*.js" -o -name "*.css" | while read file; do
    # Adicionar timestamp nos arquivos para forçar reload
    NEW_NAME="${file%.*}-$(date +%s).${file##*.}"
    mv "$file" "$NEW_NAME"
done

# Configurar permissões
log_info "Configurando permissões..."
chown -R www-data:www-data $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Reiniciar serviços
log_info "🚀 Reiniciando serviços..."
pm2 restart all
pm2 save

# Recarregar Nginx
systemctl reload nginx

# Verificar se os serviços estão funcionando
sleep 5
if pm2 status | grep -q "online"; then
    log_success "✅ Serviços reiniciados com sucesso"
    log_to_file "SUCCESS: Atualização concluída com sucesso"
else
    log_error "❌ Falha ao reiniciar serviços"
    cleanup_on_error
fi

# Testar se o site está respondendo
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    log_success "✅ Site respondendo corretamente"
    log_to_file "SUCCESS: Site funcionando após atualização"
else
    log_error "❌ Site não está respondendo"
    cleanup_on_error
fi

# Limpar backup antigo (manter apenas últimos 3)
find /tmp -name "nexia-backup-*" -type d -mtime +3 -exec rm -rf {} \; 2>/dev/null || true

log_success "🎉 Atualização concluída com sucesso!"
log_to_file "SUCCESS: Processo de atualização finalizado - versão $REMOTE_HASH"

# Enviar notificação (opcional)
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"✅ NexIA Content atualizado com sucesso!"}' \
#     YOUR_WEBHOOK_URL

echo "📊 Status final dos serviços:"
pm2 status
EOL

# Tornar o script executável
chmod +x $SCRIPTS_DIR/update-nexia.sh

# Criar script de verificação rápida
log_info "Criando script de verificação rápida..."
cat > $SCRIPTS_DIR/check-updates.sh << 'EOL'
#!/bin/bash

# Script de Verificação de Atualizações - NexIA Content
# Verifica se há atualizações disponíveis sem aplicá-las

PROJECT_DIR="/www/nexia-content"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Diretório do projeto não encontrado"
    exit 1
fi

cd $PROJECT_DIR

git fetch origin main > /dev/null 2>&1

LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo "✅ Sistema atualizado (versão: ${LOCAL_HASH:0:8})"
else
    echo "🔄 Atualização disponível:"
    echo "   Local:  ${LOCAL_HASH:0:8}"
    echo "   Remoto: ${REMOTE_HASH:0:8}"
    echo ""
    echo "Para atualizar, execute: /opt/nexia-scripts/update-nexia.sh"
fi
EOL

chmod +x $SCRIPTS_DIR/check-updates.sh

# Configurar cronjob APENAS para limpeza e manutenção (SEM atualizações automáticas)
log_info "Configurando cronjobs para manutenção (sem atualizações automáticas)..."

# Remover cronjobs antigos
crontab -l 2>/dev/null | grep -v "nexia" | crontab - 2>/dev/null || true

# Adicionar apenas cronjobs de manutenção
(crontab -l 2>/dev/null; cat << 'EOL'
# NexIA Content - Limpeza de logs semanalmente
0 2 * * 0 find /var/log -name "*nexia*" -type f -mtime +7 -delete

# NexIA Content - Restart preventivo dos serviços diariamente às 3:00  
0 3 * * * pm2 restart all && systemctl reload nginx
EOL
) | crontab -

# Criar arquivo de log
touch /var/log/nexia-updates.log
chown www-data:www-data /var/log/nexia-updates.log

# Criar script manual de atualização forçada
log_info "Criando script de atualização manual..."
cat > $SCRIPTS_DIR/force-update.sh << 'EOL'
#!/bin/bash

# Script de Atualização Manual - NexIA Content
echo "🚀 Forçando atualização do NexIA Content..."
echo "Pressione Ctrl+C nos próximos 5 segundos para cancelar..."

sleep 5

/opt/nexia-scripts/update-nexia.sh
EOL

chmod +x $SCRIPTS_DIR/force-update.sh

log_success "✅ Sistema de atualizações automáticas configurado!"
log_info "📋 Scripts disponíveis:"
echo ""
echo "   🔍 Verificar atualizações: /opt/nexia-scripts/check-updates.sh"
echo "   🔄 Atualizar automaticamente: /opt/nexia-scripts/update-nexia.sh"  
echo "   💪 Forçar atualização: /opt/nexia-scripts/force-update.sh"
echo ""
log_info "📊 Configurações do cronjob:"
echo "   • Limpeza de logs: semanalmente"
echo "   • Restart preventivo: diariamente às 3:00"
echo "   • Atualizações: MANUAIS (execute quando quiser)"
echo ""
log_info "📋 Logs de atualização em: /var/log/nexia-updates.log"

# Testar verificação inicial
log_info "🔍 Testando verificação de atualizações..."
$SCRIPTS_DIR/check-updates.sh 