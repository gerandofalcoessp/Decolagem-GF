# Dockerfile para Frontend React/Vite
FROM node:18-alpine as builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine

# Copiar build para Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx (opcional)
# COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

# Comando padrão do Nginx
CMD ["nginx", "-g", "daemon off;"]