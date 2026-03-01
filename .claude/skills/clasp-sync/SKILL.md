---
name: clasp-sync
description: clasp を使用して GAS プロジェクトとローカルのコードを同期するためのスキル。clasp pull / push の実行時に使用する。
allowed-tools: Read, Write, Terminal
---

# clasp-sync スキル

clasp を使って Google Apps Script プロジェクトとローカルリポジトリのコードを安全に同期するためのスキルです。

## スキルの目的

- clasp pull / push を安全に実行する手順の統一
- 環境（prod / dev）の取り違えを防止する
- pull / push 後のドキュメント・コミット管理の徹底

## 使用タイミング

- GAS エディタ上で直接編集された変更をローカルに取り込みたいとき
- ローカルの変更を GAS プロジェクトに反映したいとき
- 環境間のコード状態を最新化したいとき

---

## 環境情報

### prod（本番環境）

| リソース | 名称 | ID |
|---------|------|-----|
| Google Form | VRChatイベントカレンダー2024 | — |
| Form GAS | — | scriptId: `1ZxJXzMuSCFfPLzmbhXaThAUl8gxcy3BMG22x4VUhPvVdkzmBJMu81aXz` |
| Google Spreadsheet | VRChatイベントカレンダー | `1khYEj0t3eI2LnYxgnN3uJUKHHQg8CJTk3JD3vITQlQc` |
| Spreadsheet GAS | — | scriptId: `1o4UZLVDBJvKQlQSJtugy0uBPW9GOVhZhZJxgbeMZ-XHcxc5A2LLmEO-W` |
| Google Calendar | — | `0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com` |

| サービス | ディレクトリ | 主要ファイル |
|---------|------------|------------|
| Form | `prod/form/vrchat-event-calendar-2024/` | `onFormSubmitC.js` |
| Spreadsheet | `prod/spreadsheet/vrchat-event-calendar-2024-responses/` | `createOrUpdateCalendarEventC.js`, `mail.js`, `syudo_mailControl.js` |

### dev（開発環境）

| リソース | 名称 | ID |
|---------|------|-----|
| Google Form | 【検証用】VRChatイベントカレンダー2024 | — |
| Form GAS | createCalendarEvent_form_test | scriptId: `12mqT0Ciyy-qSg_9_55lUnpP_A-MzVPFcvhAHkAAL0vWHrBrfYcDN3Fat` |
| Google Spreadsheet | 【検証用】VRChatイベントカレンダー2024（回答） | `1rHTVTMSDbWq9XDY1dkAY7Sr99TNvlz35DuupZsgaRoE` |
| Spreadsheet GAS | — | scriptId: `1ZOOWCMWJn1RjMuIMfryNR3KoDXBEmJ04Kgn4CAizf2YBrAox9Gn5U45H` |
| Google Calendar | — | `6837aa0e09b99b8e9443aa0c4132920f0827d5aeb85b2a1c0768283ee04b8ab5@group.calendar.google.com` |

| サービス | ディレクトリ | 主要ファイル |
|---------|------------|------------|
| Form | `dev/form/vrchat-event-calendar-2024/` | `onFormSubmitC.js` |
| Spreadsheet | `dev/spreadsheet/vrchat-event-calendar-2024-responses/` | `コード.js` |

---

## モード1: clasp pull（GAS → ローカル）

### 目的
GAS エディタ上の最新コードをローカルに取得する。

### 🚨 重要な原則

**MUST（必須）**:
- pull 前に `git status` でローカルに未コミットの変更がないことを確認する
- pull 後に差分を確認してからコミットする
- `clasp push` は絶対に実行しない（pull のみ）

**NEVER（禁止）**:
- `clasp push` を実行してGAS上のコードを上書きする
- 差分を確認せずにコミットする
- 認証エラーを無視して先に進む

### 手順

#### 1. 前提確認

```powershell
# 未コミットの変更がないことを確認
git status
```

未コミットの変更がある場合は、先にコミットまたは stash する。

#### 2. 認証確認

```powershell
# 認証が切れている場合はログインし直す（ブラウザが開く）
clasp login
```

`invalid_grant` エラーが出た場合は `clasp login` を実行する。

#### 3. 各プロジェクトから pull

対象環境のディレクトリに移動してから `clasp pull` を実行する。

**prod 環境**:
```powershell
# prod Form
cd prod/form/vrchat-event-calendar-2024/
clasp pull

# prod Spreadsheet
cd prod/spreadsheet/vrchat-event-calendar-2024-responses/
clasp pull
```

**dev 環境**:
```powershell
# dev Form
cd dev/form/vrchat-event-calendar-2024/
clasp pull

# dev Spreadsheet
cd dev/spreadsheet/vrchat-event-calendar-2024-responses/
clasp pull
```

#### 4. 差分確認

```powershell
# ワークスペースルートに戻る
cd <ワークスペースルート>

# 変更されたファイルを確認
git status

# 各ファイルの差分を確認
git diff <ファイルパス>
```

差分の内容を確認し、意図しない変更がないかチェックする。特に以下に注意：
- `CALENDAR_ID` が正しい環境のものを指しているか
- スプレッドシートID が正しいか
- 新規ファイルが追加されていないか

#### 5. コミット

```powershell
git add -A
git commit -m "chore: <環境名> 環境の GAS から clasp pull で最新コードを取得"
```

---

## モード2: clasp push（ローカル → GAS）

### 目的
ローカルで修正したコードを GAS プロジェクトに反映する。

### 🚨 重要な原則

**MUST（必須）**:
- push 前にユーザーに明示的な確認を取る
- 対象ディレクトリの `.clasp.json` の `scriptId` が正しい環境を指しているかダブルチェックする
- コード内の環境依存値（`CALENDAR_ID`、スプレッドシートID）が正しいか確認する
- dev 環境で動作確認してから prod に push する
- push 前にローカルの変更をコミット済みであること

**NEVER（禁止）**:
- ユーザーの明示的な許可なく `clasp push` を実行する
- prod に直接 push する（dev で検証済みでない限り）
- 環境依存値を確認せずに push する

### 手順

#### 1. 環境確認チェックリスト

push 実行前に以下を必ず確認する：

- [ ] `.clasp.json` の `scriptId` が正しい環境のものか
- [ ] `CALENDAR_ID` が対象環境のカレンダーIDか
- [ ] `onFormSubmit()` 内のスプレッドシートIDが対象環境のものか
- [ ] ローカルの変更がコミット済みか
- [ ] dev 環境で動作確認が済んでいるか（prod push の場合）

#### 2. ユーザーに確認

push 対象の環境とファイルをユーザーに提示し、明示的な許可を得る。

#### 3. push 実行

```powershell
cd <対象環境のディレクトリ>
clasp push
```

#### 4. 動作確認

push 後、GAS エディタで以下を確認：
- スクリプトが正しく反映されているか（`clasp open` で確認）
- トリガーが設定されているか（初回のみ）

---

## トラブルシューティング

| 問題 | 原因 | 対処 |
|------|------|------|
| `invalid_grant` | 認証トークンの期限切れ | `clasp login` で再認証 |
| `clasp pull` で意図しないファイルが取得される | GAS 上で直接ファイルが追加されている | 差分を確認してコミット |
| どちらの環境を操作しているか分からない | ディレクトリの `.clasp.json` を確認 | `cat .clasp.json` で scriptId を表示し、上記の環境情報と照合 |

---

## 環境情報の更新

環境の ID やリソース名が変更された場合は、以下のドキュメントも同時に更新すること：
- `docs/architecture.md` — 環境ごとの Google リソース対応表
- `docs/development-guidelines.md` — 環境一覧・環境ごとの Google リソース
- `docs/repository-structure.md` — 環境ごとの GAS プロジェクト対応表
- `.claude/skills/clasp-sync/SKILL.md` — 本スキルの環境情報セクション
