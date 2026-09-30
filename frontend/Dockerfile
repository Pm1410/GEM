# GeM Bid Eligibility Verification Platform (SIH26100)
# Frontend Container Specification (Node.js 20)

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "dev"]
