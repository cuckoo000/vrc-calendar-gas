/**=============================================
 * 修正URL請求フォームが送信されたときに実行される関数
 * 請求メールアドレスに紐づく未来のイベントの修正URLをまとめて送信
 */
function sendEventEditUrls(e) {
  if (!e || !e.range || !e.values) {return;}
  var requestSheet = e.range.getSheet();
  
  // シート名チェック：請求シート以外からの実行は無視
  if (requestSheet.getName() !== '修正URL請求') {
      return;
  }
  // 1.請求条件のチェックとメールアドレスの取得
  var requestDropdownAnswer = e.values[2]; 
  if (requestDropdownAnswer !== "イベント編集URLを請求する") {
    // 処理中断:プルダウンの回答不一致
    return;
  }
  var requestedEmail = e.values[1]; 
  if (!requestedEmail) {
    // 処理中断: メールアドレスが取得できなかった
    return;
  }
  // 2.メインのイベント登録シートと列情報を取得
  var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('フォームの回答 2'); 
  if (!mainSheet) {
    // 処理中断: メインシートが見つからない
    return;
  }
  
  var columns = getColumnMapping(mainSheet);
  var data = mainSheet.getDataRange().getValues();
  var futureEventsMessage = "以下のイベントの修正URLをまとめました。\n\n";
  var eventsFound = 0;
  
  // 日時比較の基準点を設定（今日の午前0時0分0秒）
  var todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0); 
  
  // 3. メインシートを検索し、未来のイベントを抽出
  // メッセージ作成と、処理対象行のインデックスを保存する
  var processedRowIndices = [];
  var requestedEmailTrimmed = String(requestedEmail).toLowerCase().trim();

  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    // a. メールアドレスが一致するかチェック
    var eventEmail = String(rowData[columns["メールアドレス"] - 1]).toLowerCase().trim(); 
    if (eventEmail === requestedEmailTrimmed) {
      // b. 未来のイベントであるかチェック
      var startTime = new Date(rowData[columns["開始日時"] - 1]);
      if (startTime.getTime() >= todayMidnight.getTime()) { 
        var eventName = rowData[columns["イベント名"] - 1];
        var editUrl = rowData[columns["修正URL"] - 1];
        // c. メッセージに追加（修正URLが存在する場合のみ）
        if (editUrl) {
          eventsFound++;
          processedRowIndices.push(i); // 処理対象の行インデックスを記録
          var formattedStartTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
          
          futureEventsMessage += "--------------------------------------\n";
          futureEventsMessage += "イベント名: " + eventName + "\n";
          futureEventsMessage += "開始日時: " + formattedStartTime + "\n";
          futureEventsMessage += "修正URL: " + editUrl + "\n";
        }
      }
    }
  }

  // 4. 結果をメールで送信し、フラグをクリア
  if (eventsFound > 0) {
    futureEventsMessage += "\n--------------------------------------\n";
    futureEventsMessage += "上記以外の過去のイベントは自動で除外されています。\n";
    MailApp.sendEmail(
      requestedEmail, 
      "【VRChatイベントカレンダー】修正URL一括送付", 
      futureEventsMessage
    );
    
    // === 処理完了フラグのクリアとsentRowsの更新 ===
    var sentRows = PropertiesService.getScriptProperties().getProperty("sentRows") || "[]";
    sentRows = JSON.parse(sentRows);
    
    var changeFlagCol = columns["変更フラグ"];
    
    // 処理対象となった行のフラグをクリアし、sentRowsに追加
    processedRowIndices.forEach(rowIndex => {
        // 変更フラグをクリア
        mainSheet.getRange(rowIndex + 1, changeFlagCol).clearContent();
        // sentRowsに記録 (重複しないようにチェック)
        if (sentRows.indexOf(rowIndex) === -1) {
            sentRows.push(rowIndex);
        }
    });
    
    // 処理済みの行インデックスを保存
    PropertiesService.getScriptProperties().setProperty("sentRows", JSON.stringify(sentRows));
    // === 処理完了フラグのクリアとsentRowsの更新 終了 ===
    
  } else {
    // イベントが見つからなかった、またはすべて過去のイベントだった場合
    var noEventMessage = "お客様のメールアドレス (" + requestedEmail + ") に紐づく、未来に開催予定のイベントは見つかりませんでした。\n";
    noEventMessage += "登録メールアドレスが間違っているか、登録イベントがすべて終了している可能性があります。";
    MailApp.sendEmail(
      requestedEmail, 
      "【VRChatイベントカレンダー】修正URLが見つかりませんでした", 
      noEventMessage
    );
  }
}
/**=============================================
 * イベントオブジェクト（e）からスプレッドシートの列名を取得する関数
 */
function getColumnMapping(sheet) {
  if (!sheet) {
    return {};
  }
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var columns = {};

  for (var i = 0; i < headerRow.length; i++) {
    var columnName = headerRow[i];
    if (columnName) {
      columns[columnName] = i + 1;
    }
  }
  return columns;
}
/**=============================================
 * 「語録リスト」シートから、メールアドレスと主催者名のブラックリストを読み込む関数
 */
function getBlacklists() {
   var blacklistSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('語録リスト');
  if (!blacklistSheet) {
    // 処理中断:「語録リスト」シート見つからない
    return { keywords: [], emails: [], organizers: [] };
  }
  var lastRow = blacklistSheet.getLastRow();
  // データなし
  if (lastRow < 2) {
    return { keywords: [], emails: [], organizers: [] };
  }
  // A2から最終行までの2列（A列とB列）のデータを取得
  var range = blacklistSheet.getRange(2, 1, lastRow - 1, 2);
  var values = range.getValues();
  var emails = [];
  var organizers = [];

values.forEach(row => {
  // A列: メールアドレス
  var email = String(row[0]).trim().toLowerCase(); 
  if (email.length > 0) {
    emails.push(email);
  }
  // B列: イベント主催者名
  var organizer = String(row[1]).trim().toLowerCase(); // B列はrow[1]
  if (organizer.length > 0) {
   organizers.push(organizer);
  }
  });
  // keywordsは空の配列を返す
  return { keywords: [], emails: emails, organizers: organizers };
}

/**=============================================
 * カレンダーイベントを登録・更新するメイン関数（スプレッドシートトリガー）
 */
function createOrUpdateCalendarEvent(e) {
  if (!e || !e.range || !e.values) {return;}
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  // シート名チェック：メインシート以外からの実行は無視
  if (sheet.getName() !== 'フォームの回答 2') {
      return; 
  }
  var editedRow = e.range.getRow();

  // 編集リンクがスプレッドシートに記載されない事象を緩和する為、取得する前に5秒待つ
  Utilities.sleep(5000);

  var columns = getColumnMapping(sheet);

// --- 迷惑フィルタリングの開始（メールアドレスと主催者名チェック） ---
  var email = sheet.getRange(editedRow, columns["メールアドレス"]).getValue();
  var eventOrganizer = sheet.getRange(editedRow, columns["イベント主催者"]).getValue(); // 主催者名を取得
  var eventId = sheet.getRange(editedRow, columns["イベントID"]).getValue(); 

  var blacklists = getBlacklists();
  var emailLower = String(email).toLowerCase(); 
  var organizerLower = String(eventOrganizer).toLowerCase(); // 主催者名を小文字に変換
  var calendar = CalendarApp.getCalendarById('0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com');

  var isBlacklisted = false;
  // 1. メールアドレスによるチェック（A列）
  if (blacklists.emails.includes(emailLower)) {
      isBlacklisted = true;
  } 
  // 2. イベント主催者名によるチェック（B列）
  if (!isBlacklisted && blacklists.organizers.includes(organizerLower)) {
      isBlacklisted = true;
  }
  // フィルタリングに引っかかった場合
  if (isBlacklisted) {
      // 既存イベントであればカレンダーから削除し、IDをクリアする
      if (eventId) {
          var event = calendar.getEventById(eventId);
        if (event) {
            event.deleteEvent();
            sheet.getRange(editedRow, columns["イベントID"]).clearContent();
        }
      }
      // 変更フラグを立てて、sendAggregatedEmailsに処理結果を通知
      sheet.getRange(editedRow, columns["変更フラグ"]).setValue(true);
      return; // ブラックリストに載っている場合はここで処理を終了
  }
  // --- 迷惑フィルタリングの終了 以下通常処理開始 ---

  // 必要な回答フィールドをすべて取得
  // ※フォームの改造などによりスプレッドシートの列名が追加・変更された場合はまずここを見る（イベントIDとメールのアドレスは事前に取得済み）
  var eventName = sheet.getRange(editedRow, columns["イベント名"]).getValue();
  var android_pc = sheet.getRange(editedRow, columns["Android対応可否"]).getValue();
  var deleteCheckbox = sheet.getRange(editedRow, columns["イベントを登録しますか"]).getValue();
  var eOrganizer = sheet.getRange(editedRow, columns["イベント主催者"]).getValue();
  var eDetails = sheet.getRange(editedRow, columns["イベント内容"]).getValue();
  var eGenre = sheet.getRange(editedRow, columns["イベントジャンル"]).getValue();
  var eConditions = sheet.getRange(editedRow, columns["参加条件（モデル、人数制限など）"]).getValue();
  var eMethod = sheet.getRange(editedRow, columns["参加方法"]).getValue();
  var eRemarks = sheet.getRange(editedRow, columns["備考"]).getValue();
  var editResponseUrl = sheet.getRange(editedRow, columns["修正URL"]).getValue();
  var startTime = new Date(sheet.getRange(editedRow, columns["開始日時"]).getValue());
  var endTime = new Date(sheet.getRange(editedRow, columns["終了日時"]).getValue());

  var message = "";
  message += "【イベント主催者】\n" + "　" + eOrganizer;
  message += "\n【イベント内容】\n" + "　" + eDetails;
  message += "\n【イベントジャンル】\n" + "　" + eGenre;
  message += "\n【参加条件（モデル、人数制限など）】\n" + "　" + eConditions;
  message += "\n【参加方法】\n" + "　" + eMethod;
  message += "\n【備考】\n" + "　" + eRemarks;

  // 削除チェック
  if (deleteCheckbox === "イベントを削除する") {
    if (eventId) {
      var event = calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent();
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns["変更フラグ"]).setValue(true);
    return;
  }

  // 過去日時チェック
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  if (today > startTime) {
    // 処理中断: 開始日時が過去
    if (eventId) {
      var event = calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent();
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns["変更フラグ"]).setValue(true);
    return;
  }

  // 開始と終了日時の逆転チェック
  if (endTime < startTime) {
    // 処理中断: 終了日時が開始日時より前
    if (eventId) {
      var event = calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent();
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns["変更フラグ"]).setValue(true);
    return;
  }

  var VRCTitle = eventName;
  if (android_pc === "PC/android") {
    VRCTitle = '【Android 対応】' + VRCTitle;
  } else if (android_pc === "android only") {
    VRCTitle = '【Android オンリー】' + VRCTitle;
  }

  if (eventId) {
    var event = calendar.getEventById(eventId);
    if (event) {
      event.setTitle(VRCTitle);
      event.setTime(startTime, endTime);
      event.setDescription(message);
    } 
  } else {
    if (endTime > startTime) {
      var newEvent = calendar.createEvent(VRCTitle, startTime, endTime, { description: message }).setGuestsCanSeeGuests(false);
      sheet.getRange(editedRow, columns["イベントID"]).setValue(newEvent.getId());
    }
  }
  sheet.getRange(editedRow, columns["変更フラグ"]).setValue(true);
}

/**=============================================
 * 登録結果をメールアドレスごとに集約して送信する関数
 */
function sendAggregatedEmails() {
  var CALENDAR_URL = "https://vrceve.com/";

  // メール本文に使用するヘッダーとフッター
  var header = "いつもご利用ありがとうございます。\n\n"
             + "VRChatイベントカレンダーへの登録結果をお知らせします。内容をご確認ください。\n"
             + "----------------------------------------\n";
             
  var footer = "\n----------------------------------------\n"
             + "■ VRChatイベントカレンダーで確認する\n"
             + "【カレンダーURL】 " + CALENDAR_URL + "\n\n"
             + "ご不明な点がありましたら、管理者までお問い合わせください。\n"
             + "引き続き、ご利用をお待ちしております。\n";
  // -------------------------------------------------------------

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var columns = getColumnMapping(sheet);
  var sentRows = PropertiesService.getScriptProperties().getProperty("sentRows") || "[]";
  sentRows = JSON.parse(sentRows);
  var aggregatedEmails = {};

  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    
    // 未送信または変更フラグが立っている行を処理
    if (sentRows.indexOf(i) === -1 || sheet.getRange(i + 1, columns["変更フラグ"]).getValue() === true) {
      var email = rowData[columns["メールアドレス"] - 1];
      var subject = "";
      var body = "";
      var eventName = rowData[columns["イベント名"] - 1];
      var editResponseUrl = rowData[columns["修正URL"] - 1]; 
      var deleteCheckbox = rowData[columns["イベントを登録しますか"] - 1];
      var eventId = rowData[columns["イベントID"] - 1];
      // Dateオブジェクトに変換
      var startTime = new Date(rowData[columns["開始日時"] - 1]);
      var endTime = new Date(rowData[columns["終了日時"] - 1]);
      // イベントタイムを整形
      var formattedTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      var formattedEndTime = Utilities.formatDate(endTime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      // イベントタイトル作成
      var formattedEventName = "【" + eventName + " (" + formattedTime + "～" + ")】";

      // 処理結果に応じた件名と本文の生成
      // 迷惑登録判定 (イベントIDが空欄 && 変更フラグがON && 削除チェックではない)
      if (sheet.getRange(i + 1, columns["変更フラグ"]).getValue() === true && !eventId && deleteCheckbox !== "イベントを削除する") {
          // 処理スキップ: 迷惑登録によりカレンダー登録が拒否された行
          // 処理済みとして記録し、変更フラグをクリア
          sentRows.push(i);
          sheet.getRange(i + 1, columns["変更フラグ"]).clearContent();
          continue;
      } else if (deleteCheckbox === "イベントを削除する") {
        subject = "【VRChatイベントカレンダー】イベント削除申請受付";
        body = formattedEventName + "\n"
              + "イベント削除申請を受け付けました。再度、登録する場合は下記のURLから登録できます。\n" 
              + editResponseUrl;
      } else if (new Date() > startTime) {
        subject = "【VRChatイベントカレンダー】登録失敗通知";
        body = formattedEventName + "\n"
              + "イベントの開始日時が過去のため、登録できませんでした。下記のURLから内容を変更して再登録申請してください。\n" 
              + editResponseUrl;
      } else if (endTime < startTime) {
        subject = "【VRChatイベントカレンダー】登録失敗通知";
        body = formattedEventName + "\n"
              + "イベントの終了日時（" + formattedEndTime + "）が開始日時より前のため、登録できませんでした。下記のURLから内容を変更して再登録申請してください。\n" 
              + editResponseUrl;
      } else {
        subject = "【VRChatイベントカレンダー】イベント登録・更新完了通知";
        body = formattedEventName + "\n"
              + "新しいイベントが登録されました、または内容が更新されました。下記のURLからいつでも内容を変更できます。\n" 
              + editResponseUrl;
      }
      // メールアドレスごとに本文を集約
      if (!aggregatedEmails[email]) {
        aggregatedEmails[email] = { subject: subject, body: header + body };
      } else {
        aggregatedEmails[email].body += "\n\n----------------------------------------\n\n" + body;
      }
      // 処理済みとして記録
      sentRows.push(i);
      sheet.getRange(i + 1, columns["変更フラグ"]).clearContent();
    }
  }

  // ループ終了後フッターを追記してメール送信
  for (var email in aggregatedEmails) {
    aggregatedEmails[email].body += footer;
    MailApp.sendEmail(email, aggregatedEmails[email].subject, aggregatedEmails[email].body);
  }

  // 処理済みの行インデックスを保存
  PropertiesService.getScriptProperties().setProperty("sentRows", JSON.stringify(sentRows));
}