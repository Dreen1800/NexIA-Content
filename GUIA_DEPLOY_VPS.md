# 🚀 Guia Completo de Deploy - NexIA Content VPS

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 10+
- Domínio: `content.nexialab.com.br` apontando para o IP da VPS
- Acesso SSH root ou usuário com sudo
- Credenciais do Supabase

## ⚡ Deploy Rápido - Execução dos Scripts

### 1. Preparar VPS (Primeira Vez)

```bash
# Conectar na VPS
ssh root@SEU-IP-DA-VPS

# Instalar dependências básicas
apt update && apt upgrade -y
apt install -y curl wget git unzip software-properties-common

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Instalar PM2 e Nginx
npm install -g pm2
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2. Executar Scripts de Deploy

```bash
# Baixar os scripts do repositório
cd /tmp
wget https://raw.githubusercontent.com/Dreen1800/NexIA-Content/main/setup-nexia-content.sh
wget https://raw.githubusercontent.com/Dreen1800/NexIA-Content/main/setup-ssl.sh
wget https://raw.githubusercontent.com/Dreen1800/NexIA-Content/main/setup-auto-update.sh

# Tornar executáveis
chmod +x *.sh

# 1️⃣ Setup inicial do projeto
sudo ./setup-nexia-content.sh

# 2️⃣ Configurar suas credenciais
nano /www/nexia-content/.env
# Edite as variáveis do Supabase

# 3️⃣ Configurar SSL (HTTPS)
sudo ./setup-ssl.sh

# 4️⃣ Configurar atualizações automáticas
sudo ./setup-auto-update.sh
```

## 🔧 Configuração Manual Detalhada

### Passo 1: Configurar Arquivo .env

```bash
nano /www/nexia-content/.env
```

**Conteúdo do arquivo .env:**
```env
NODE_ENV=production
VITE_SUPABASE_URL=https://sua-url-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
PORT=3001
VITE_APP_DOMAIN=https://content.nexialab.com.br
VITE_APP_ENV=production
```

### Passo 2: Verificar DNS

Certifique-se que o domínio está apontando para sua VPS:
```bash
nslookup content.nexialab.com.br
```

### Passo 3: Verificar Serviços

```bash
# Status do PM2
pm2 status

# Status do Nginx
systemctl status nginx

# Logs da aplicação
pm2 logs

# Logs do Nginx
tail -f /var/log/nginx/nexia-content-access.log
```

## 🔄 Sistema de Atualizações Automáticas

### Scripts Disponíveis

1. **Verificar Atualizações:**
   ```bash
   /opt/nexia-scripts/check-updates.sh
   ```

2. **Atualizar Manualmente:**
   ```bash
   /opt/nexia-scripts/update-nexia.sh
   ```

3. **Forçar Atualização:**
   ```bash
   /opt/nexia-scripts/force-update.sh
   ```

### Configurações Automáticas

- 🔧 **Atualizações:** Apenas quando você executar manualmente
- 🧹 **Limpeza de logs:** Semanalmente
- 🔄 **Restart preventivo:** Diariamente às 3:00

### Logs de Atualizações

```bash
# Ver logs de atualização
tail -f /var/log/nexia-updates.log

# Ver últimas 50 linhas
tail -50 /var/log/nexia-updates.log
```

## 🛠️ Comandos de Manutenção

### Gerenciar PM2

```bash
# Ver status
pm2 status

# Reiniciar todos os processos
pm2 restart all

# Parar todos os processos
pm2 stop all

# Ver logs em tempo real
pm2 logs

# Monitoramento
pm2 monit
```

### Gerenciar Nginx

```bash
# Testar configuração
nginx -t

# Recarregar configuração
systemctl reload nginx

# Reiniciar Nginx
systemctl restart nginx

# Ver logs de erro
tail -f /var/log/nginx/nexia-content-error.log
```

### Limpeza Manual de Cache

```bash
cd /www/nexia-content

# Limpar cache npm
npm cache clean --force

# Rebuild da aplicação
npm run build

# Limpar cache do Nginx
rm -rf /var/cache/nginx/*

# Reiniciar serviços
pm2 restart all
systemctl reload nginx
```

## 🔒 Configurações de Segurança

### Firewall (UFW)

```bash
# Habilitar firewall
ufw enable

# Permitir SSH
ufw allow ssh

# Permitir HTTP e HTTPS
ufw allow 80
ufw allow 443

# Ver status
ufw status
```

### SSL/HTTPS

O certificado SSL é renovado automaticamente via cron job:
```bash
# Ver certificatos
certbot certificates

# Testar renovação
certbot renew --dry-run

# Forçar renovação
certbot renew --force-renewal
```

## 📊 Monitoramento

### Health Checks

```bash
# Verificar se o site está funcionando
curl -I https://content.nexialab.com.br/health

# Verificar proxy do Instagram
curl -I https://content.nexialab.com.br/api/instagram-proxy?url=https://example.com/image.jpg
```

### Performance

```bash
# Ver uso de recursos
htop

# Ver uso de disco
df -h

# Ver processos Node.js
ps aux | grep node

# Ver conexões de rede
netstat -tulpn | grep :3001
```

## 🆘 Solução de Problemas

### Site não está acessível

1. **Verificar DNS:**
   ```bash
   nslookup content.nexialab.com.br
   ```

2. **Verificar Nginx:**
   ```bash
   nginx -t
   systemctl status nginx
   ```

3. **Verificar PM2:**
   ```bash
   pm2 status
   pm2 logs
   ```

### Erro 502 Bad Gateway

1. **Verificar se o servidor Node.js está rodando:**
   ```bash
   pm2 status
   curl http://localhost:3001/health
   ```

2. **Reiniciar serviços:**
   ```bash
   pm2 restart all
   systemctl reload nginx
   ```

### Proxy do Instagram não funciona

1. **Testar endpoint diretamente:**
   ```bash
   curl -I http://localhost:3001/health
   ```

2. **Ver logs específicos:**
   ```bash
   pm2 logs instagram-proxy
   ```

3. **Verificar configuração de rede:**
   ```bash
   curl -I https://scontent-mia3-1.cdninstagram.com/
   ```

## 📞 Comandos de Emergência

### Rollback Rápido

Se algo der errado após uma atualização:

```bash
# Parar serviços
pm2 stop all

# Restaurar último backup
BACKUP_DIR=$(ls -td /tmp/nexia-backup-* | head -1)
rm -rf /www/nexia-content
mv $BACKUP_DIR /www/nexia-content
chown -R www-data:www-data /www/nexia-content

# Reiniciar serviços
pm2 restart all
systemctl reload nginx
```

### Reset Completo

Para começar do zero:

```bash
# Parar tudo
pm2 stop all
pm2 delete all

# Remover projeto
rm -rf /www/nexia-content

# Executar setup novamente
./setup-nexia-content.sh
```

## 🎯 Checklist Final

- [ ] Domínio `content.nexialab.com.br` apontando para VPS
- [ ] Arquivo `.env` configurado com credenciais do Supabase
- [ ] SSL/HTTPS funcionando
- [ ] PM2 iniciando automaticamente
- [ ] Nginx servindo o site
- [ ] Proxy do Instagram funcionando
- [ ] Atualizações automáticas configuradas
- [ ] Logs sendo gerados corretamente
- [ ] Health checks respondendo

## 📈 URLs de Teste

Após o deploy, teste estas URLs:

- **Site principal:** https://content.nexialab.com.br
- **Health check:** https://content.nexialab.com.br/health
- **Proxy Instagram:** https://content.nexialab.com.br/api/instagram-proxy?url=https://exemplo.com/image.jpg

---

🎉 **Parabéns!** Sua aplicação NexIA Content está rodando em produção com sistema de proxy do Instagram e atualizações automáticas! 