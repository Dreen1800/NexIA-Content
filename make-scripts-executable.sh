#!/bin/bash

# Script para tornar todos os scripts executáveis
echo "🔧 Tornando scripts executáveis..."

chmod +x setup-nexia-content.sh
chmod +x setup-ssl.sh  
chmod +x setup-auto-update.sh
chmod +x deploy-vps.sh
chmod +x quick-update.sh

echo "✅ Todos os scripts estão prontos para execução!"
echo ""
echo "📋 Scripts disponíveis:"
echo "   1. ./setup-nexia-content.sh - Configuração inicial completa"
echo "   2. ./setup-ssl.sh - Configuração SSL/HTTPS"
echo "   3. ./setup-auto-update.sh - Sistema de atualizações manuais"
echo "   4. ./quick-update.sh - Atualização rápida (use sempre que quiser)"
echo "   5. ./deploy-vps.sh - Deploy completo (alternativo)"
echo ""
echo "🚀 Execute: sudo ./setup-nexia-content.sh para começar" 