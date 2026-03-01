# 設計書

## アーキテクチャ概要

既存の `createOrUpdateCalendarEventC.js` 内のバリデーションチェーンに、6時間超過チェックを1つ追加する。
新しい関数やファイルの追加は不要。既存パターンに完全に合わせた最小変更。

## 変更対象

### ファイル: `prod/spreadsheet/vrchat-event-calendar-2024-responses/createOrUpdateCalendarEventC.js`

変更箇所は2つ:

1. **`createOrUpdateCalendarEvent()` — バリデーション追加**（メイン処理）
2. **`sendAggregatedEmails()` — メール通知分岐追加**（通知処理）

## 変更内容の詳細

### 1. `createOrUpdateCalendarEvent()` への6時間超過チェック追加

**挿入位置**: 「開始と終了日時の逆転チェック」の直後、「VRCTitle 生成」の直前（L316〜L317 付近）

**挿入するコード**:
```javascript
  // 6時間超過チェック
  var timeDiff = (endTime - startTime) / (1000 * 60 * 60);
  if (timeDiff > 6) {
    // 処理中断: イベント時間が6時間を超過
    if (eventId) {
      var event = calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent();
        sheet.getRange(editedRow, columns[COL_EVENT_ID]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns[CHANGE_FLAG_COLUMN_NAME]).setValue(true);
    sheet.getRange(editedRow, columns[SENT_FLAG_COLUMN_NAME]).clearContent();
    return;
  }
```

**設計判断**:
- 既存の「過去日時チェック」「逆転チェック」と完全に同じパターン（イベント削除→フラグ設定→return）
- 逆転チェックの後に配置する理由: endTime < startTime の場合に timeDiff が負になるため、先に逆転チェックで弾いておく

### 2. `sendAggregatedEmails()` への6時間超過メール通知追加

**挿入位置**: `sendAggregatedEmails()` 内の条件分岐（L446〜L458 付近）で、`endTime < startTime` の分岐の直後、`else`（正常登録）の直前

**挿入するコード**:
```javascript
      } else if ((endTime - startTime) / (1000 * 60 * 60) > 6) {
        subject = "【VRChatイベントカレンダー】登録失敗通知";
        body = formattedEventName + "\n"
              + "6時間を超えるイベントは登録できません。下記のURLから終了日時を変更して再登録申請してください。\n" 
              + editResponseUrl;
```

**設計判断**:
- 既存の条件分岐（削除→過去日時→逆転）に1つ追加するだけ
- メール件名は他のエラーケースと統一（`【VRChatイベントカレンダー】登録失敗通知`）

## データフロー

```
フォーム送信
  ↓
createOrUpdateCalendarEvent()
  ↓
  バリデーションチェーン:
  1. ブラックリストチェック → ブロック
  2. 削除チェック → 削除処理
  3. 過去日時チェック → ブロック
  4. 逆転チェック → ブロック
  5. ★6時間超過チェック → ブロック（今回追加）
  6. カレンダー登録/更新
  ↓
変更フラグ ON
  ↓
sendAggregatedEmails()（定期実行）
  ↓
  通知メール条件分岐:
  1. 迷惑登録 → スキップ
  2. 削除 → 削除通知
  3. 過去日時 → 失敗通知
  4. 逆転 → 失敗通知
  5. ★6時間超過 → 失敗通知（今回追加）
  6. 正常 → 登録完了通知
```

## 影響範囲

| 対象 | 影響 |
|------|------|
| `createOrUpdateCalendarEvent()` | バリデーション追加（既存ロジックへの影響なし） |
| `sendAggregatedEmails()` | 条件分岐追加（既存分岐への影響なし） |
| `sendEventEditUrls()` | 影響なし |
| `getColumnMapping()` | 影響なし |
| `getBlacklists()` | 影響なし |
| `mail.js` | 影響なし |
| `syudo_mailControl.js` | 影響なし |
| Form GAS (`onFormSubmitC.js`) | 影響なし |

## テスト戦略

GAS プロジェクトのため自動テストはなし。手動テストで確認する。

### 確認項目
- 6時間超のイベント登録 → カレンダーに登録されないこと
- 6時間ちょうど → カレンダーに登録されること
- 5時間59分 → カレンダーに登録されること
- 既存イベントを6時間超に変更 → カレンダーから削除されること
- 正常なイベント → 今まで通り登録されること

## ディレクトリ構造

変更なし（既存ファイルの修正のみ）。
