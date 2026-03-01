# 開発ガイドライン (Development Guidelines)

## 1. コーディング規約

### 1.1 命名規則

本プロジェクトは JavaScript（Google Apps Script）で実装される。

**変数・関数**:
```javascript
// ✅ 良い例: camelCase、意味のある名前
var editResponseUrl = e.response.getEditResponseUrl();
var formattedStartTime = Utilities.formatDate(startTime, ...);
function createOrUpdateCalendarEvent(e) { }
function getColumnMapping(sheet) { }

// ❌ 悪い例: 短すぎる、意味が不明
var url = e.response.getEditResponseUrl();
var t = Utilities.formatDate(startTime, ...);
function update(e) { }
```

**定数**: UPPER_SNAKE_CASE
```javascript
// ✅ 良い例
const CALENDAR_ID = '...';
const MAX_EMAILS_PER_RUN = 20;
const MAIN_EVENT_SHEET_NAME = 'フォームの回答 1';
const COL_EVENT_NAME = 'イベント名';
```

**Boolean 変数**: `is`, `has` で始める
```javascript
var isBlacklisted = false;
var isNewEvent = false;
var isPassed = true;
```

**ファイル名**:
- 関数名ベースの camelCase + 環境サフィックス: `onFormSubmitC.js`, `createOrUpdateCalendarEventC.js`
- または日本語名: `コード.js`（ただし統一することを推奨）

### 1.2 コードフォーマット

- **インデント**: 2スペース
- **文字列**: ダブルクォート `"` を基本とする（既存コードに合わせる）
- **セミコロン**: 必須
- **行末の空白**: 削除する

### 1.3 コメント規約

**関数ヘッダー**: `/**` ブロックコメントで区切り線を使用
```javascript
/**=============================================
 * カレンダーイベントを登録・更新するメイン関数（スプレッドシートトリガー）
 */
function createOrUpdateCalendarEvent(e) {
```

**セクション区切り**: コメントで処理ブロックを明示
```javascript
// =============================================
// I. ★グローバル設定パラメータ★
// =============================================

// --- 迷惑フィルタリングの開始 ---
// ...
// --- 迷惑フィルタリングの終了 以下通常処理開始 ---
```

**インラインコメント**: 「なぜ」を説明する
```javascript
// ✅ 良い例: 理由を説明
// 編集リンクがスプレッドシートに記載されない事象を緩和する為、取得する前に5秒待つ
Utilities.sleep(5000);

// ❌ 悪い例: コードの繰り返し
// 5秒待つ
Utilities.sleep(5000);
```

### 1.4 エラーハンドリング

**ガード節パターン**: 早期リターンで処理を打ち切る
```javascript
// ✅ 良い例: ガード節で異常系を先に処理
function createOrUpdateCalendarEvent(e) {
  if (!e || !e.range || !e.values) { return; }
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getName() !== MAIN_EVENT_SHEET_NAME) { return; }
  // ... 正常処理
}
```

**メール送信のエラーハンドリング**: try-catch で個別にキャッチし、他の送信を継続
```javascript
try {
  MailApp.sendEmail(email, subject, body);
} catch (e) {
  Logger.log("メール送信エラー (" + email + "): " + e.toString());
}
```

### 1.5 セキュリティ

- **ブラックリスト比較**: 必ず `trim().toLowerCase()` で正規化してから比較する
- **機密情報**: スプレッドシートID、カレンダーIDはコード内に直接記述（GAS の制約上、環境変数は使用不可）。Git で公開リポジトリにしないこと
- **入力バリデーション**: フォーム回答値は必ず検証してからカレンダーに反映する（日時チェック等）

---

## 2. Git 運用ルール

### 2.1 ブランチ戦略

個人開発のため、シンプルな運用とする。

```
master          ← 本番デプロイ可能な状態を維持
  └─ feature/xxx  ← 機能追加・修正時にブランチを切る（推奨）
```

- **master**: 安定版。直接コミットも可能だが、大きな変更時は feature ブランチを推奨
- **feature/[機能名]**: 新機能や大きな変更を行う際に作成
- **fix/[修正内容]**: バグ修正

### 2.2 コミットメッセージ規約

Conventional Commits の簡易版を採用する。

**フォーマット**:
```
<type>: <subject>
```

**Type**:
| Type | 用途 | 例 |
|------|------|-----|
| `feat` | 新機能追加 | `feat: ブラックリスト機能を追加` |
| `fix` | バグ修正 | `fix: メール送信の二重送信を防止` |
| `docs` | ドキュメント | `docs: アーキテクチャ設計書を追加` |
| `refactor` | リファクタリング | `refactor: カレンダー処理を関数分割` |
| `chore` | 設定変更・雑務 | `chore: .clasp.json のscriptId更新` |

**例**:
```
feat: メール集約送信機能を実装
fix: 修正URL請求で過去イベントが含まれる問題を修正
docs: 機能設計書を追加
refactor: ブラックリストチェックを関数に分離
chore: dev環境のCALENDAR_IDを更新
```

---

## 3. clasp デプロイ手順

### 3.1 前提条件

- Node.js がインストールされていること
- `npm install -g @google/clasp` で clasp がインストールされていること
- `clasp login` で Google アカウントにログイン済みであること

### 3.2 デプロイ手順

#### Form GAS のデプロイ

```powershell
# 1. 対象環境のディレクトリに移動
cd prod/form/vrchat-event-calendar-2024/

# 2. GAS プロジェクトに反映
clasp push

# 3. 確認（任意: ブラウザでスクリプトエディタを開く）
clasp open
```

#### Spreadsheet GAS のデプロイ

```powershell
# 1. 対象環境のディレクトリに移動
cd prod/spreadsheet/vrchat-event-calendar-2024-responses/

# 2. GAS プロジェクトに反映
clasp push

# 3. 確認
clasp open
```

### 3.3 デプロイ時のチェックリスト

- [ ] 対象ディレクトリの `.clasp.json` の `scriptId` が正しい環境を指しているか確認
- [ ] コード内の `CALENDAR_ID` が対象環境のカレンダーIDになっているか確認
- [ ] `onFormSubmit()` 内のスプレッドシートIDが対象環境のものか確認
- [ ] dev 環境で動作確認してから prod にデプロイする
- [ ] デプロイ後、GAS エディタでトリガーが設定されていることを確認（初回のみ）

### 3.4 トリガー設定（初回のみ）

GAS エディタ（clasp open で開く）から手動で設定する。

**Form GAS**:
| 関数 | イベント種類 | イベントタイプ |
|------|------------|-------------|
| `onFormSubmit` | フォームから | フォーム送信時 |

**Spreadsheet GAS**:
| 関数 | イベント種類 | イベントタイプ |
|------|------------|-------------|
| `createOrUpdateCalendarEvent` | スプレッドシートから | 変更時 |
| `sendEventEditUrls` | スプレッドシートから | 変更時 |
| `sendAggregatedEmails` | 時間主導型 | 分タイマー（間隔は要件に応じて設定） |

### 3.5 GAS からのコード取得

GAS エディタ上で直接編集された変更をローカルに取り込む場合：

```powershell
# 対象ディレクトリに移動してから実行
clasp pull
```

> **注意**: `clasp pull` はローカルファイルを上書きするので、事前に `git status` で未コミットの変更がないことを確認する

---

## 4. 環境管理

### 4.1 環境一覧

| 環境 | 用途 | ディレクトリ |
|------|------|------------|
| prod | 本番環境 | `prod/` |
| dev | 開発・テスト | `dev/` |

### 4.2 環境ごとの Google リソース

**prod（本番環境）**

| リソース | 名称 | ID |
|---------|------|----|
| Google Form | VRChatイベントカレンダー2024 | — |
| Form GAS | — | scriptId: `1ZxJXzMuSCFfPLzmbhXaThAUl8gxcy3BMG22x4VUhPvVdkzmBJMu81aXz` |
| Google Spreadsheet | VRChatイベントカレンダー | `1khYEj0t3eI2LnYxgnN3uJUKHHQg8CJTk3JD3vITQlQc` |
| Spreadsheet GAS | — | scriptId: `1o4UZLVDBJvKQlQSJtugy0uBPW9GOVhZhZJxgbeMZ-XHcxc5A2LLmEO-W` |
| Google Calendar | — | `0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com` |

**dev（開発環境）**

| リソース | 名称 | ID |
|---------|------|----|
| Google Form | 【検証用】VRChatイベントカレンダー2024 | — |
| Form GAS | createCalendarEvent_form_test | scriptId: `12mqT0Ciyy-qSg_9_55lUnpP_A-MzVPFcvhAHkAAL0vWHrBrfYcDN3Fat` |
| Google Spreadsheet | 【検証用】VRChatイベントカレンダー2024（回答） | `1rHTVTMSDbWq9XDY1dkAY7Sr99TNvlz35DuupZsgaRoE` |
| Spreadsheet GAS | — | scriptId: `1ZOOWCMWJn1RjMuIMfryNR3KoDXBEmJ04Kgn4CAizf2YBrAox9Gn5U45H` |
| Google Calendar | — | `6837aa0e09b99b8e9443aa0c4132920f0827d5aeb85b2a1c0768283ee04b8ab5@group.calendar.google.com` |

### 4.3 環境切替時の手順

1. 対象環境のディレクトリに `cd` する
2. `.clasp.json` の `scriptId` を確認（誤った環境に push しないため）
3. コード内の環境依存値を確認:
   - `CALENDAR_ID`
   - `onFormSubmit()` 内のスプレッドシートID
   - `onFormSubmit()` 内の列番号

### 4.4 既知の問題

| 問題 | 影響 | 対応方針 |
|------|------|--------|
| ファイル名の不統一（`createOrUpdateCalendarEventC.js` vs `コード.js`） | 保守性の低下 | 全環境でファイル名を統一する |
| prod と dev でコードの構造が乖離 | dev での検証結果が prod に適用できない | 将来的にソースの一元化を検討 |

---

## 5. テスト

### 5.1 現状

手動テストで動作確認を行っている。

### 5.2 手動テスト手順

1. **dev 環境でテスト**: dev のフォームからテストデータを送信
2. **カレンダー確認**: dev 環境の Google Calendar にイベントが正しく登録されるか確認
3. **メール確認**: テスト用メールアドレスに通知メールが届くか確認
4. **エラーケース確認**:
   - 過去日時で登録 → エラーメールが届くか
   - 日時逆転で登録 → エラーメールが届くか
   - 削除チェックで送信 → カレンダーから削除されるか
5. **ログ確認**: GAS エディタの「実行数」でエラーがないか確認

### 5.3 テスト前の確認事項

- dev 環境の `CALENDAR_ID` が dev 用カレンダーを指していること
- dev 環境のスプレッドシートIDが dev 用スプレッドシートを指していること
- テストデータが本番カレンダーに反映されないこと

---

## 6. ログ・デバッグ

### 6.1 ログ出力

`Logger.log()` でデバッグ情報を出力する。

```javascript
Logger.log("イベント名: " + eventName);
Logger.log("列マッピング: " + JSON.stringify(columns));
Logger.log("GASクォータ残数: " + emailQuotaRemaining);
```

### 6.2 ログの確認方法

1. GAS エディタを開く（`clasp open`）
2. 「実行数」タブを開く
3. 対象の実行を クリックしてログを表示

### 6.3 デバッグ時の注意

- 本番環境で `Logger.log()` に個人情報（メールアドレス等）を出力しすぎないよう注意
