#!/bin/bash

# Script de Atualização Manual Rápida - NexIA Content
# Execute quando quiser atualizar sua aplicação

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 NexIA Content - Atualização Manual${NC}"
echo "=================================================="

# Verificar se está sendo executado como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Execute com sudo: sudo ./quick-update.sh${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 Verificando se há atualizações disponíveis...${NC}"

# Executar verificação
if command -v /opt/nexia-scripts/check-updates.sh &> /dev/null; then
    /opt/nexia-scripts/check-updates.sh
    echo ""
    
    # Perguntar se quer continuar
    echo -e "${YELLOW}Deseja continuar com a atualização? (s/N)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}🚀 Iniciando atualização...${NC}"
        /opt/nexia-scripts/update-nexia.sh
    else
        echo -e "${GREEN}✅ Atualização cancelada pelo usuário${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Scripts de atualização não encontrados!${NC}"
    echo "Execute primeiro: sudo ./setup-auto-update.sh"
fi

echo ""
echo -e "${GREEN}✨ Processo finalizado!${NC}" 