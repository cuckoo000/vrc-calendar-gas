# CLAUDE.md

## プロジェクト概要

VRChatイベントカレンダーの自動化システム（Google Apps Script）。Google Forms で受け付けたイベント情報を GAS で処理し、Google Calendar への登録・更新・削除、および登録者へのメール通知を自動で行う。

## ドキュメント構造

- `docs/` — 永続的な設計ドキュメント（PRD、機能設計、技術仕様等）。変更前に必ず参照すること。
- `.steering/[YYYYMMDD]-[タイトル]/` — 作業単位のドキュメント（requirements.md, design.md, tasklist.md）。

## 必須ルール

- **承認フロー**: ドキュメント・設計は1ファイルごとにユーザーの承認を得てから次に進む。
- **ステアリング運用**: 機能追加・修正時は `.steering/` に作業ディレクトリを作成してから実装を開始する。
- **tasklist.md が正**: 進捗管理は tasklist.md への記録が正式。TodoWriteは補助。

## ツール・技術スタック

- **言語**: JavaScript（Google Apps Script）
- **デプロイ**: clasp（GAS CLI）
- **外部サービス**: Google Forms / Google Sheets / Google Calendar / MailApp

## 図表・ダイアグラムの記載ルール

### 記載場所
設計図やダイアグラムは、関連する永続的ドキュメント内に直接記載します。
独立したdiagramsフォルダは作成せず、手間を最小限に抑えます。

**配置例:**
- ER図、データモデル図 → 'functional-design.md' 内に記載
- ユーズケース図 → 'functional-design.md' または 'product-requirements.md' 内に記載
- 画面遷移図、ワイヤフレーム → 'functional-design.md' 内に記載
- システム構成図 → 'functional-design.md' または 'architecture.md' 内に記載

### 記述形式
1. **Mermaid記法(推奨)**
  - Markdownに直接埋め込める
  - バージョン管理が容易
  - ツール不要で編集可能

'''mermaid
graph TD
  A[ユーザー] --> B[タスク作成]
  B --> C[タスク一覧]
  C --> D[タスク編集]
  C --> E[タスク削除]
'''

2. **ASCII アート**
  - シンプルな図表に使用
  - テキストエディタで編集可能

'''
┌──────────┐
│ Header   │
└──────────┘
   |
   ↓
┌──────────┐
│ Task List│
└──────────┘
'''

3.**画像ファイル(必要な場合のみ)**
  - 複雑なワイヤーフレームやモックアップ
  - 'docs/images/'フォルダに配置
  - PNG または SVG 形式を推奨

### 図表の更新
- 設計変更時は対応する図表も同時に更新
- 図表とコードの乖離を防ぐ

## コーディング上の注意

- XSS対策、入力バリデーションを必ず行う
- 詳細な規約は `docs/development-guidelines.md` を参照

## 注意事項

- ドキュメントの作成・更新は段階的に行い、各段階で承認を得る
- '.steering/' のディレクトリ名は日付と開発タイトルで明確に識別できるようにする
- 永続的ドキュメントと作業単位のドキュメントを混同しない
- 共通のデザインシステム(Tailwind CSS)を使用して統一感を保つ
- セキュリティを考慮したコーディング(XSS対策、入力バリデーションなど) 
- 図表は最小限にとどめ、メンテナンスコストを抑える。
