# S&OP MVP アプリケーション

このアプリケーションは、営業・製造・物流・財務の各計画を統合し、AIによる調整提案を行うS&OP（Sales and Operations Planning）支援ツールのMVP（Minimum Viable Product）です。

## 機能概要

*   **ダッシュボード**: PSI（生産・販売・在庫）、機会損失、AI提案、財務パフォーマンス（予実管理）の可視化。
*   **販売計画**: 月別の販売数・売単価の入力（スプレッドシート形式、コピペ対応）。
*   **生産計画**: 月別の生産数・原単価の入力。
*   **物流計画**: 初期在庫、倉庫キャパシティ、保管コストの設定。
*   **財務計画**: 各部門の予算設定。
*   **AI提案**: 在庫過多や欠品リスクに対する調整案の提示。
*   **データ保存**: SQLiteを使用したローカルデータベースへの保存。

## ローカル環境での実行方法

このプロジェクトをローカル環境で実行するには、以下の手順に従ってください。

### 前提条件

*   Node.js (v18以上推奨) がインストールされていること。

### 手順

1.  **リポジトリのクローンまたはダウンロード**
    ```bash
    git clone <repository-url>
    cd sparse-filament
    ```
    ※ フォルダ名は適宜変更してください。

2.  **依存関係のインストール**
    ```bash
    npm install
    ```

3.  **開発サーバーの起動**
    ```bash
    npm run dev
    ```

4.  **ブラウザでアクセス**
    ブラウザを開き、`http://localhost:3000` にアクセスしてください。

## テストの実行

ユニットテストとコンポーネントテストを実行するには、以下のコマンドを使用します。

```bash
npm test
```

## GitHubでの管理方法

このプロジェクトをGitHubで管理するには、以下の手順を実行してください。

1.  GitHub上で新しいリポジトリを作成します（空のリポジトリ）。
2.  ローカルディレクトリで以下のコマンドを実行します。

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 技術スタック

*   **Frontend**: Next.js (App Router), React, Recharts, Lucide React
*   **Styling**: Vanilla CSS (CSS Modules)
*   **Backend/DB**: Next.js API Routes, SQLite (better-sqlite3)
*   **Testing**: Jest, React Testing Library
