# リポジトリ構造定義書 (Repository Structure Document)

## プロジェクト構造

```
vrc-calendar-gas/
├── CLAUDE.md                          # プロジェクトメモリ（AI向けコンテキスト）
├── docs/                              # 永続的ドキュメント
│   ├── product-requirements.md        # プロダクト要求定義書
│   ├── functional-design.md           # 機能設計書
│   ├── architecture.md                # アーキテクチャ設計書
│   ├── repository-structure.md        # リポジトリ構造定義書（本ドキュメント）
│   ├── development-guidelines.md      # 開発ガイドライン
│   └── glossary.md                    # ユビキタス言語定義
├── .steering/                         # 作業単位のドキュメント
│   └── [YYYYMMDD]-[開発タイトル]/
│       ├── requirements.md            # 作業の要求内容
│       ├── design.md                  # 変更内容の設計
│       └── tasklist.md                # タスクリスト
├── prod/                              # 本番環境
│   ├── form/
│   │   └── vrchat-event-calendar-2024/
│   │       ├── .clasp.json            # clasp 設定（本番 Form の scriptId）
│   │       ├── appsscript.json        # GAS マニフェスト
│   │       └── onFormSubmitC.js       # フォーム送信トリガー
│   └── spreadsheet/
│       └── vrchat-event-calendar-2024-responses/
│           ├── .clasp.json            # clasp 設定（本番 Spreadsheet の scriptId）
│           ├── appsscript.json        # GAS マニフェスト
│           ├── createOrUpdateCalendarEventC.js  # カレンダー処理・メール通知
│           ├── mail.js                # メールクォータ確認ユーティリティ
│           └── syudo_mailControl.js    # 過去イベントのフラグバッチ処理
├── dev/                               # 開発環境（※現在未配置。再構築時に prod からコピーして作成する）
```

---

## ディレクトリ詳細

### docs/ （永続的ドキュメント）

**役割**: アプリケーション全体の「何を作るか」「どう作るか」を定義する恒久的なドキュメント置き場。基本設計や方針が変わらない限り更新されない。

**配置ファイル**:

| ファイル | 説明 |
|---------|------|
| `product-requirements.md` | プロダクト要求定義書（PRD） |
| `functional-design.md` | 機能設計書（データモデル、コンポーネント設計、処理フロー） |
| `architecture.md` | アーキテクチャ設計書（技術スタック、システム構成、デプロイ） |
| `repository-structure.md` | リポジトリ構造定義書（本ドキュメント） |
| `development-guidelines.md` | 開発ガイドライン（コーディング規約、Git運用、clasp手順） |
| `glossary.md` | ユビキタス言語定義（ドメイン用語、命名規則） |

### .steering/ （作業単位のドキュメント）

**役割**: 特定の作業・変更に特化したドキュメント。作業ごとに新しいディレクトリを作成し、完了後は履歴として保存される。

**命名規則**: `.steering/[YYYYMMDD]-[開発タイトル]/`

**例**:
```
.steering/20260301-add-blacklist-feature/
.steering/20260315-fix-email-quota/
.steering/20260401-refactor-calendar-handler/
```

**各ディレクトリに配置するファイル**:

| ファイル | 説明 |
|---------|------|
| `requirements.md` | 今回の作業の要求内容、受け入れ条件 |
| `design.md` | 実装アプローチ、影響範囲の分析 |
| `tasklist.md` | 具体的な実装タスクと進捗状況 |

### prod/ （本番環境）

**役割**: 本番の Google Forms / Spreadsheet に紐づく GAS コード。`vrceve.com` で公開中のカレンダーに反映される。

**構成**:
- `form/` — Google Form に紐づく GAS プロジェクト
- `spreadsheet/` — Google Spreadsheet に紐づく GAS プロジェクト

**注意**: このディレクトリのコードを `clasp push` すると本番環境に即座に反映される。必ず dev 環境で動作確認後にデプロイすること。

### dev/ （開発環境）

**役割**: 開発・テスト用の環境。prod と同一のコード構成を持つべきだが、**現在ローカルリポジトリには未配置**。

**現在の状態**: prod との大幅な乖離が生じたため、旧 dev/ を削除済み（Git 履歴には残存）。再構築時は prod のコードをコピーし、環境依存値を dev 用に差し替えて作成する。

**再構築時の手順**:
1. `dev/` ディレクトリを prod と同一構造で作成
2. `.clasp.json` の `scriptId` を dev 用 GAS プロジェクトに差し替え
3. コード内の `CALENDAR_ID`、スプレッドシートIDを dev 環境のものに差し替え
4. `clasp push` で dev 用 GAS プロジェクトに反映

---

## ファイル配置規則

### ソースファイル

| ファイル種別 | 配置先 | 説明 |
|------------|--------|------|
| Form GAS コード | `{環境}/form/{プロジェクト名}/` | フォーム送信トリガー処理 |
| Spreadsheet GAS コード | `{環境}/spreadsheet/{プロジェクト名}/` | カレンダー処理・メール通知 |
| clasp 設定 | 各 GAS コードと同じディレクトリ | `.clasp.json`（scriptId を含む） |
| GAS マニフェスト | 各 GAS コードと同じディレクトリ | `appsscript.json`（タイムゾーン、ランタイム設定） |

### ドキュメントファイル

| ファイル種別 | 配置先 | 命名規則 |
|------------|--------|---------|
| 永続的ドキュメント | `docs/` | kebab-case `.md` |
| 作業単位ドキュメント | `.steering/[YYYYMMDD]-[タイトル]/` | 固定ファイル名（requirements.md, design.md, tasklist.md） |
| プロジェクトメモリ | ルート | `CLAUDE.md` |

### 設定ファイル

| ファイル | 配置先 | 説明 |
|---------|--------|------|
| `.clasp.json` | 各 GAS プロジェクトディレクトリ | GAS プロジェクトの scriptId とデプロイ設定 |
| `appsscript.json` | 各 GAS プロジェクトディレクトリ | GAS ランタイム設定（V8、タイムゾーン: Asia/Tokyo） |

---

## 環境ごとの GAS プロジェクト対応表

| 環境 | サービス | Google リソース名 | scriptId | ディレクトリ | 主要ファイル |
|------|---------|-----------------|----------|------------|------------|
| prod | Form | VRChatイベントカレンダー2024 | `1ZxJXzM...81aXz` | `prod/form/vrchat-event-calendar-2024/` | `onFormSubmitC.js` |
| prod | Spreadsheet | VRChatイベントカレンダー | `1o4UZLV...mEO-W` | `prod/spreadsheet/vrchat-event-calendar-2024-responses/` | `createOrUpdateCalendarEventC.js`, `mail.js`, `syudo_mailControl.js` |
| dev | Form | 【検証用】VRChatイベントカレンダー2024 | `12mqT0C...N3Fat` | `dev/form/vrchat-event-calendar-2024/`（未配置） | — |
| dev | Spreadsheet | 【検証用】VRChatイベントカレンダー2024（回答） | `1ZOOWCM...5U45H` | `dev/spreadsheet/vrchat-event-calendar-2024-responses/`（未配置） | — |

---

## 既知の構造上の課題

| 課題 | 影響 | 対応方針 |
|------|------|---------|
| dev/ が未配置 | 開発・テストがローカルで行えない | 次回開発作業時に prod からコピーして再構築する |
| 将来的なソース一元化 | 環境ごとのコード重複 | `src/` + デプロイスクリプトによる一元管理を検討 |
