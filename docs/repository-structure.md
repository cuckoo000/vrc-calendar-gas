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
│           └── createOrUpdateCalendarEventC.js  # カレンダー処理・メール通知
├── dev/                               # 開発環境
│   ├── form/
│   │   └── vrchat-event-calendar-2024/
│   │       ├── .clasp.json
│   │       ├── appsscript.json
│   │       └── onFormSubmitC.js
│   └── spreadsheet/
│       └── vrchat-event-calendar-2024-responses/
│           ├── .clasp.json
│           ├── appsscript.json
│           └── コード.js               # prod の createOrUpdateCalendarEventC.js と同等
└── dev_multi-event-registration/      # 複数イベント登録の実験環境
    ├── form/
    │   ├── .clasp.json
    │   ├── appsscript.json
    │   └── onFormSubmitC.js
    └── spreadsheet/
        ├── .clasp.json
        ├── appsscript.json
        └── コード.js                   # 複数登録機能追加版
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

**役割**: 開発・テスト用の環境。prod とほぼ同一のコード構成を持つ。

**prod との差異**:
- `.clasp.json` の `scriptId` が dev 用の GAS プロジェクトを指す（Spreadsheet は別、Form は既知の問題あり）
- コード内の `CALENDAR_ID`、スプレッドシートID が dev 環境のものを指す
- ファイル名が `コード.js`（prod は `createOrUpdateCalendarEventC.js`）

### dev_multi-event-registration/ （複数イベント登録実験環境）

**役割**: 複数イベント登録機能の実験・開発用環境。

**prod/dev との差異**:
- `copyRowToLog()` 関数（複数登録シートへの行コピー）が追加されている
- ブラックリスト機能、集約メール送信、修正URL請求が未実装
- メール送信がコメントアウトされている
- 変更フラグ管理なし
- サブフォルダ名が省略されている（`form/` 直下にファイルを配置）

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

| 環境 | サービス | ディレクトリ | 主要ファイル |
|------|---------|------------|------------|
| prod | Form | `prod/form/vrchat-event-calendar-2024/` | `onFormSubmitC.js` |
| prod | Spreadsheet | `prod/spreadsheet/vrchat-event-calendar-2024-responses/` | `createOrUpdateCalendarEventC.js` |
| dev | Form | `dev/form/vrchat-event-calendar-2024/` | `onFormSubmitC.js` |
| dev | Spreadsheet | `dev/spreadsheet/vrchat-event-calendar-2024-responses/` | `コード.js` |
| dev_multi | Form | `dev_multi-event-registration/form/` | `onFormSubmitC.js` |
| dev_multi | Spreadsheet | `dev_multi-event-registration/spreadsheet/` | `コード.js` |

---

## 既知の構造上の課題

| 課題 | 影響 | 対応方針 |
|------|------|---------|
| dev と prod の Form が同じ scriptId | clasp push で相互に上書きするリスク | dev 用 Form GAS プロジェクトを別途作成 |
| ファイル名の不統一（`createOrUpdateCalendarEventC.js` vs `コード.js`） | 保守性低下、どのファイルが何か分かりにくい | 全環境でファイル名を統一 |
| dev_multi のサブフォルダ構成が他環境と異なる | 構成の一貫性が欠ける | サブフォルダ名を統一するか、意図的な省略としてドキュメント化 |
| 環境間でコードがほぼ重複 | 片方だけ修正して差分が発生するリスク | 将来的にソースの一元化（`src/` + デプロイスクリプト）を検討 |
