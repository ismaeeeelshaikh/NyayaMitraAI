# Nyaya Mitra — AI Legal Assistant for India

An AI-powered legal assistant that helps Indian citizens understand their legal rights, file complaints, and connect with legal aid organizations.

## Project Structure

```
nyaya-mitra/
├── infra/          ← AWS CDK Infrastructure (Member 1)
├── backend/        ← Lambda Functions (Member 2 & 3)
└── frontend/       ← React Web App (Member 4)
```

## Tech Stack

- **Infrastructure**: AWS CDK (TypeScript)
- **Backend**: AWS Lambda (Python 3.11)
- **Database**: DynamoDB (12 tables)
- **Storage**: S3 (5 buckets)
- **Auth**: Cognito User Pool
- **API**: API Gateway HTTP + WebSocket
- **AI**: AWS Bedrock (Amazon Nova Pro)
- **Frontend**: React + Vite

## Quick Start

```bash
# 1. Install dependencies
cd infra && npm install

# 2. Build
npm run build

# 3. Deploy (AWS credentials required)
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## Budget

~$100/month total project cost (see cost breakdown in docs).

## Team

- **Member 1**: Infrastructure, Auth & Backend Foundation
- **Member 2**: Chat Pipeline, Voice Mode, RAG
- **Member 3**: Document Generation, Notice Analysis
- **Member 4**: Frontend (React)
