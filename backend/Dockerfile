# Dockerfile para Backend Node.js/TypeScript
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Expor porta
EXPOSE 3001

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Mudar ownership dos arquivos
RUN chown -R nodejs:nodejs /app
USER nodejs

# Comando para iniciar a aplicação
CMD ["npm", "start"]