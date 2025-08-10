#!/bin/bash

# 開発環境起動スクリプト
set -e

echo "🚀 Starting Inventoria Development Environment"

# 環境変数の読み込み
if [ -f "env.development" ]; then
    export $(cat env.development | grep -v '^#' | xargs)
    echo "✅ Environment variables loaded"
fi

# 依存関係の確認
echo "📦 Checking dependencies..."

# Node.jsとpnpmの確認
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed"
    exit 1
fi

# uvの確認
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed"
    exit 1
fi

echo "✅ All dependencies are installed"

# データベースの確認
echo "🗄️  Checking database connection..."
if ! uv run python -c "
import psycopg2
try:
    conn = psycopg2.connect('$DATABASE_URL')
    conn.close()
    print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"; then
    echo "❌ Database connection failed"
    echo "Please ensure PostgreSQL is running and accessible"
    exit 1
fi

echo "✅ Database connection successful"

# フロントエンドとバックエンドの同時起動
echo "🔄 Starting frontend and backend servers..."

# concurrentlyを使用して両方を同時に起動
if command -v npm &> /dev/null; then
    npm run dev
else
    echo "⚠️  npm not found, starting servers manually..."
    
    # バックグラウンドでバックエンドを起動
    echo "Starting backend server..."
    uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    # 少し待ってからフロントエンドを起動
    sleep 3
    echo "Starting frontend server..."
    cd frontend && pnpm run dev &
    FRONTEND_PID=$!
    
    # プロセス終了時のクリーンアップ
    trap "echo 'Shutting down servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
    
    # 両方のプロセスが終了するまで待機
    wait
fi 