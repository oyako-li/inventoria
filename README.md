# Inventoria - 在庫管理システム

QRコードをスキャンして在庫を自動管理するWebアプリケーションです。

## 機能

- 📦 **在庫管理**: 商品の追加、編集、削除
- 📋 **入出庫管理**: 商品の入庫・出庫記録
- 🚚 **仕入先管理**: 仕入先情報の管理
- 💰 **収支管理**: 月次収支の可視化と分析
- 🔐 **認証システム**: JWTベースのユーザー認証
- 👥 **ユーザー管理**: ユーザー登録・ログイン機能

## 技術スタック

### バックエンド
- **FastAPI**: Webフレームワーク
- **PostgreSQL**: データベース
- **SQLAlchemy**: ORM
- **JWT**: 認証トークン
- **Passlib**: パスワードハッシュ化

### フロントエンド
- **React**: UIフレームワーク
- **TypeScript**: 型安全な開発
- **Vite**: ビルドツール
- **React Context**: 状態管理

### 開発環境
- **VS Code Dev Container**: 統一された開発環境
- **Docker**: コンテナ化
- **uv**: Pythonパッケージ管理
- **pnpm**: Node.jsパッケージ管理

## 開発環境のセットアップ

### 前提条件
- Node.js 18以上
- pnpm 8以上
- Python 3.12以上
- uv
- PostgreSQL 15以上

### クイックスタート

#### 方法1: VS Code Dev Container（推奨）
```bash
# VS Codeでプロジェクトを開く
# Ctrl+Shift+P → "Dev Containers: Reopen in Container" を選択
# コンテナビルド完了後、以下のコマンドを実行：

# 依存関係のインストール
npm run install:all

# 開発環境の起動
./dev-start.sh
```

#### 方法2: 自動セットアップ
```bash
# 依存関係のインストールとセットアップ
make setup-dev

# 開発サーバーの起動
make dev
```

#### 方法3: 手動セットアップ
```bash
# 1. 依存関係のインストール
npm install
cd frontend && pnpm install
uv sync

# 2. データベースマイグレーション
make migrate

# 3. 開発サーバーの起動
make dev
```

#### 方法4: Dockerを使用
```bash
# Docker開発環境の起動
make docker-dev
```

### 開発コマンド

| コマンド | 説明 |
|---------|------|
| `make dev` | フロントエンドとバックエンドを同時起動 |
| `make dev-backend` | バックエンドのみ起動 |
| `make dev-frontend` | フロントエンドのみ起動 |
| `make build` | フロントエンドとバックエンドをビルド |
| `make test` | テストを実行 |
| `make lint` | リンティングを実行 |
| `make clean` | ビルド成果物をクリーンアップ |

### Dev Containerコマンド

| コマンド | 説明 |
|---------|------|
| `./dev-start.sh` | 開発環境を一括起動 |
| `npm run dev` | フロントエンドとバックエンドを同時起動 |
| `npm run dev:backend` | バックエンドのみ起動 |
| `npm run dev:frontend` | フロントエンドのみ起動 |

### 環境変数の設定

開発環境用の環境変数ファイルを作成してください：

**バックエンド** (`env.development`):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/inventoria
SECRET_KEY=dev-secret-key-change-in-production
TEAM_ID=dev-team-id
DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**フロントエンド** (`frontend/env.development`):
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Inventoria Dev
VITE_DEBUG=true
```

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. 新規アカウントを登録するか、既存アカウントでログイン
3. 在庫管理、入出庫管理、仕入先管理の各機能を使用

## API エンドポイント

### 認証
- `POST /api/auth/register`: ユーザー登録
- `POST /api/auth/login`: ログイン
- `GET /api/auth/me`: 現在のユーザー情報取得

### 在庫管理
- `GET /inventory/`: 在庫一覧取得
- `POST /inventory/`: 在庫追加
- `PUT /inventory/{id}`: 在庫更新
- `DELETE /inventory/{id}`: 在庫削除

### 仕入先管理
- `GET /supplier/`: 仕入先一覧取得
- `POST /supplier/`: 仕入先追加
- `PUT /supplier/{id}`: 仕入先更新
- `DELETE /supplier/{id}`: 仕入先削除

## 開発

### プロジェクト構造

```
inventoria/
├── frontend/                 # Reactフロントエンド
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── contexts/        # React Context
│   │   └── types.ts         # TypeScript型定義
│   └── package.json
├── models/                  # データベースモデル
│   ├── schemas.py          # SQLAlchemyモデル
│   └── db.py               # データベース接続
├── router/                 # FastAPIルーター
│   ├── auth.py            # 認証関連API
│   ├── inventory.py       # 在庫管理API
│   └── supplier.py        # 仕入先管理API
├── pages/                  # Streamlitページ
├── main.py                # FastAPIアプリケーション
└── README.md
```

## Dev Container詳細ガイド

### Dev Containerとは

VS Code Dev Containerは、開発環境をDockerコンテナ内で統一し、チーム全体で同じ開発環境を共有できる機能です。

### メリット

- 🐳 **環境の統一**: 全開発者が同じ環境で開発
- 🚀 **セットアップの簡素化**: 環境構築が不要
- 🔧 **ツールの事前インストール**: 必要なツールが全て揃っている
- 📦 **依存関係の管理**: パッケージの競合を回避

### 使用方法

#### 1. 初回セットアップ

1. VS Codeでプロジェクトを開く
2. `Ctrl+Shift+P` (macOS: `Cmd+Shift+P`) を押す
3. "Dev Containers: Reopen in Container" を選択
4. コンテナのビルドが完了するまで待つ（初回は時間がかかります）

#### 2. 開発環境の起動

Dev Container内で以下のコマンドを実行：

```bash
# 依存関係のインストール（初回のみ）
npm run install:all

# 開発環境の起動
./.devcontainer/start-dev.sh
```

#### 3. アクセス

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5431

### 含まれるツール

- **Python 3.12** with uv package manager
- **Node.js 18** with pnpm
- **PostgreSQL 15**
- **Git**
- **開発用エディタ拡張機能**:
  - Python (Pylance, Python)
  - TypeScript/React
  - ESLint, Prettier
  - Docker
  - GitLens

### トラブルシューティング

#### コンテナが起動しない場合

```bash
# コンテナのログを確認
docker logs <container_name>

# コンテナを再ビルド
docker-compose -f .devcontainer/docker-compose.yml down
docker-compose -f .devcontainer/docker-compose.yml build --no-cache
```

#### ポートが使用中の場合

`.devcontainer/devcontainer.json`の`forwardPorts`セクションでポートを変更してください。

#### データベース接続エラー

```bash
# PostgreSQLの状態を確認
docker-compose -f .devcontainer/docker-compose.yml ps

# データベースに接続
docker-compose -f .devcontainer/docker-compose.yml exec postgres psql -U postgres -d inventoria
```

### カスタマイズ

#### 新しい拡張機能の追加

`.devcontainer/devcontainer.json`の`extensions`セクションに追加：

```json
"extensions": [
  "ms-python.python",
  "your-extension-id"
]
```

#### 環境変数の追加

`.devcontainer/docker-compose.yml`の`environment`セクションに追加：

```yaml
environment:
  - YOUR_ENV_VAR=value
```

## ライセンス

MIT License