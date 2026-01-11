// =============================================
// I. ★グローバル設定パラメータ★
// =============================================
// フォーム回答が書き込まれるメインシートの名前
const MAIN_EVENT_SHEET_NAME = 'フォームの回答 1';
// 修正URL請求フォームの回答シートの名前
const REQUEST_URL_SHEET_NAME = '修正URL請求';
// 例の語録リストが記載されているシートの名前
const BLACKLIST_SHEET_NAME = '語録リスト';
// イベントを登録するGoogleカレンダーのID（テスト環境時から以降の際は必ず確認）
// テスト環境→140749af77185343ed9181ecaa00ffa4780673d695825e106b99b061a4ee8ce4@group.calendar.google.com
const CALENDAR_ID = '0058cd78d2936be61ca77f27b894c73bfae9f1f2aa778a762f0c872e834ee621@group.calendar.google.com';
// ユーザーに通知するカレンダーURL
const NOTIFICATION_CALENDAR_URL = 'https://vrceve.com/';

// 1回のスクリプト実行で最大何件のメールアドレスに送信するかを制限します。
// この値と残りクォータ数（メールの送信可能数）を比較し低い方を送信制限数として採用します。クォータ数が0になったら送信を自動でストップします。
const MAX_EMAILS_PER_RUN = 20;

const CHANGE_FLAG_COLUMN_NAME = '変更フラグ';
const SENT_FLAG_COLUMN_NAME = '送信済みフラグ';

const COL_EMAIL = 'メールアドレス';
const COL_EVENT_NAME = 'イベント名';
const COL_EDIT_URL = '修正URL';
const COL_DELETE_CHECKBOX = 'イベントを登録しますか';
const COL_EVENT_ID = 'イベントID';
const COL_START_TIME = '開始日時';
const COL_END_TIME = '終了日時';
const COL_EVENT_ORGANIZER = 'イベント主催者';
const COL_ANDROID_PC = 'Android対応可否';
const COL_EVENT_DETAILS = 'イベント内容';
const COL_EVENT_GENRE = 'イベントジャンル';
const COL_CONDITIONS = '参加条件（モデル、人数制限など）';
const COL_METHOD = '参加方法';
const COL_REMARKS = '備考';
// ---------------------------------------------

/**=============================================
 * 修正URL請求フォームが送信されたときに実行される関数
 * 請求メールアドレスに紐づく未来のイベントの修正URLをまとめて送信
 */
function sendEventEditUrls(e) {
  if (!e || !e.range || !e.values) {return;}
  var requestSheet = e.range.getSheet();
  
  // シート名チェック：請求シート以外からの実行は無視
  if (requestSheet.getName() !== REQUEST_URL_SHEET_NAME) { 
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
  var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(MAIN_EVENT_SHEET_NAME); 
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
    var eventEmail = String(rowData[columns[COL_EMAIL] - 1]).toLowerCase().trim(); 
    if (eventEmail === requestedEmailTrimmed) {
      // b. 未来のイベントであるかチェック
      var startTime = new Date(rowData[columns[COL_START_TIME] - 1]);
      if (startTime.getTime() >= todayMidnight.getTime()) { 
        var eventName = rowData[columns[COL_EVENT_NAME] - 1];
        var editUrl = rowData[columns[COL_EDIT_URL] - 1];
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
    
    var changeFlagCol = columns[CHANGE_FLAG_COLUMN_NAME];
    var sentFlagCol = columns[SENT_FLAG_COLUMN_NAME];
    
    // 処理対象となった行のフラグをクリアし、sentRowsに追加
    processedRowIndices.forEach(rowIndex => {
        mainSheet.getRange(rowIndex + 1, changeFlagCol).clearContent();// 変更フラグをクリア
        mainSheet.getRange(rowIndex + 1, sentFlagCol).setValue(true);//送信済みフラグをTRUEに設定
    });    
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
  var blacklistSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BLACKLIST_SHEET_NAME);
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
  if (sheet.getName() !== MAIN_EVENT_SHEET_NAME) {
      return; 
  }
  var editedRow = e.range.getRow();

  // 編集リンクがスプレッドシートに記載されない事象を緩和する為、取得する前に5秒待つ
  Utilities.sleep(5000);

  var columns = getColumnMapping(sheet);

  // --- 迷惑フィルタリングの開始（メールアドレスと主催者名チェック） ---
  var email = sheet.getRange(editedRow, columns[COL_EMAIL]).getValue();
  var eventOrganizer = sheet.getRange(editedRow, columns[COL_EVENT_ORGANIZER]).getValue(); // 主催者名を取得
  var eventId = sheet.getRange(editedRow, columns[COL_EVENT_ID]).getValue(); 

  var blacklists = getBlacklists();
  var emailLower = String(email).toLowerCase(); 
  var organizerLower = String(eventOrganizer).toLowerCase(); // 主催者名を小文字に変換
  var calendar = CalendarApp.getCalendarById(CALENDAR_ID);

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
            sheet.getRange(editedRow, columns[COL_EVENT_ID]).clearContent();
        }
      }
      // 変更フラグを立てて、sendAggregatedEmailsに処理結果を通知
      sheet.getRange(editedRow, columns[CHANGE_FLAG_COLUMN_NAME]).setValue(true);
      return; // ブラックリストに載っている場合はここで処理を終了
  }
  // --- 迷惑フィルタリングの終了 以下通常処理開始 ---

  // 必要な回答フィールドをすべて取得
  var eventName = sheet.getRange(editedRow, columns[COL_EVENT_NAME]).getValue();
  var android_pc = sheet.getRange(editedRow, columns[COL_ANDROID_PC]).getValue();
  var deleteCheckbox = sheet.getRange(editedRow, columns[COL_DELETE_CHECKBOX]).getValue();
  var eOrganizer = sheet.getRange(editedRow, columns[COL_EVENT_ORGANIZER]).getValue();
  var eDetails = sheet.getRange(editedRow, columns[COL_EVENT_DETAILS]).getValue();
  var eGenre = sheet.getRange(editedRow, columns[COL_EVENT_GENRE]).getValue();
  var eConditions = sheet.getRange(editedRow, columns[COL_CONDITIONS]).getValue();
  var eMethod = sheet.getRange(editedRow, columns[COL_METHOD]).getValue();
  var eRemarks = sheet.getRange(editedRow, columns[COL_REMARKS]).getValue();
  var editResponseUrl = sheet.getRange(editedRow, columns[COL_EDIT_URL]).getValue();
  var startTime = new Date(sheet.getRange(editedRow, columns[COL_START_TIME]).getValue());
  var endTime = new Date(sheet.getRange(editedRow, columns[COL_END_TIME]).getValue());

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
        sheet.getRange(editedRow, columns[COL_EVENT_ID]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns[CHANGE_FLAG_COLUMN_NAME]).setValue(true);
    sheet.getRange(editedRow, columns[SENT_FLAG_COLUMN_NAME]).clearContent();
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
        sheet.getRange(editedRow, columns[COL_EVENT_ID]).clearContent();
      }
    }
    sheet.getRange(editedRow, columns[CHANGE_FLAG_COLUMN_NAME]).setValue(true);
    sheet.getRange(editedRow, columns[SENT_FLAG_COLUMN_NAME]).clearContent();
    return;
  }

  // 開始と終了日時の逆転チェック
  if (endTime < startTime) {
    // 処理中断: 終了日時が開始日時より前
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
      sheet.getRange(editedRow, columns[COL_EVENT_ID]).setValue(newEvent.getId());
    }
  }
  sheet.getRange(editedRow, columns[CHANGE_FLAG_COLUMN_NAME]).setValue(true);
  sheet.getRange(editedRow, columns[SENT_FLAG_COLUMN_NAME]).clearContent();
}

/**=============================================
 * 登録結果をメールアドレスごとに集約して送信する関数
 */
function sendAggregatedEmails() {

// クォータ数チェック
  var emailQuotaRemaining = MailApp.getRemainingDailyQuota();
  Logger.log("GASクォータ残数: " + emailQuotaRemaining);
  // 最大送信数とクォータ残数比較して小さい方を採用
  var effectiveMaxEmails = Math.min(MAX_EMAILS_PER_RUN, emailQuotaRemaining);
  Logger.log("今回の実行で処理するメールの最大数: " + effectiveMaxEmails);
  if (effectiveMaxEmails <= 0) {
    Logger.log("制限により実行をスキップ");
    return;
  }

  var CALENDAR_URL = NOTIFICATION_CALENDAR_URL;

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
  if (sheet.getName() !== MAIN_EVENT_SHEET_NAME) { return; }
  
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 2) { return; }// データ行がない場合は終了

  var dataRange = sheet.getRange(1, 1, lastRow, lastColumn);
  var data = dataRange.getValues();
  var columns = getColumnMapping(sheet);
  
  var aggregatedEmails = {};
  var successfulSendTargets = [];

  const EMAIL_INDEX = columns[COL_EMAIL] - 1;
  const CHANGE_FLAG_INDEX = columns[CHANGE_FLAG_COLUMN_NAME] - 1; 
  const SENT_FLAG_INDEX = columns[SENT_FLAG_COLUMN_NAME] - 1;     
  const EVENT_NAME_INDEX = columns[COL_EVENT_NAME] - 1;
  const EDIT_URL_INDEX = columns[COL_EDIT_URL] - 1;
  const DELETE_CHECKBOX_INDEX = columns[COL_DELETE_CHECKBOX] - 1;
  const EVENT_ID_INDEX = columns[COL_EVENT_ID] - 1;
  const START_TIME_INDEX = columns[COL_START_TIME] - 1;
  const END_TIME_INDEX = columns[COL_END_TIME] - 1;

  for (var i = 1; i < data.length; i++) {
    var rowData = data[i];
    var ssRowIndex = i + 1;

    var isChanged = rowData[CHANGE_FLAG_INDEX] === true;
    var isSent = rowData[SENT_FLAG_INDEX] === true;

    // 「変更フラグが立っている」かつ「送信済みフラグが立っていない」行を処理
    if (isChanged && !isSent) { 
      var email = rowData[EMAIL_INDEX];
      var subject = "";
      var body = "";
      var eventName = rowData[EVENT_NAME_INDEX];
      var editResponseUrl = rowData[EDIT_URL_INDEX]; 
      var deleteCheckbox = rowData[DELETE_CHECKBOX_INDEX];
      var eventId = rowData[EVENT_ID_INDEX];
      // Dateオブジェクトに変換
      var startTime = new Date(rowData[START_TIME_INDEX]);
      var endTime = new Date(rowData[END_TIME_INDEX]);
      // イベントタイムを整形
      var formattedTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      var formattedEndTime = Utilities.formatDate(endTime, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      // イベントタイトル作成
        var formattedEventName = "【" + eventName + " (" + formattedTime + "～" + ")】";

        var isPassed = true; // メール送信に進むかどうかの判定フラグ

      // 処理結果に応じた件名と本文の生成
      // 迷惑登録判定 (イベントIDが空欄 && 変更フラグがON && 削除チェックではない)
      if (isChanged && !eventId && deleteCheckbox !== "イベントを削除する") {
          isPassed = false;
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
      if (isPassed) {
        if (!aggregatedEmails[email]) {
            aggregatedEmails[email] = { subject: subject, body: header + body };
        } else {
            aggregatedEmails[email].body += "\n\n----------------------------------------\n\n" + body;
        }
        // 送信後のフラグ処理の準備（列番号は1から始まるため +1）
        successfulSendTargets.push({
            email: email, 
            changeFlagRange: sheet.getRange(ssRowIndex, CHANGE_FLAG_INDEX + 1).getA1Notation(), 
            sentFlagRange: sheet.getRange(ssRowIndex, SENT_FLAG_INDEX + 1).getA1Notation()
        });
      }
    }
  }
  var emailCount = 0;
  var sentEmailAddresses = []; // メールを送信したアドレスを記録

  for (var email in aggregatedEmails) {
      if (emailCount >= effectiveMaxEmails) {
        Logger.log("設定された上限 (" + effectiveMaxEmails + ") に達したため、メール送信を中断しました。");
        break; 
      }
      aggregatedEmails[email].body += footer;
      try {
        MailApp.sendEmail(email, aggregatedEmails[email].subject, aggregatedEmails[email].body);
        sentEmailAddresses.push(email); // 送信が成功したメールアドレスを記録
        emailCount++;
      } catch (e) {
         Logger.log("メール送信エラー (" + email + "): " + e.toString());
        }
    }
    // -----------------------------------------------------------
    // 一括フラグ更新（実際に送信されたメールのみ対象）
    // -----------------------------------------------------------
    var rangesToClear = [];
    var rangesToSetSent = [];

    // 送信済みのリストに含まれているアドレスの行のみ、フラグ更新リストに追加
    successfulSendTargets.forEach(target => {
        if (sentEmailAddresses.includes(target.email)) {
            rangesToClear.push(target.changeFlagRange);
            rangesToSetSent.push(target.sentFlagRange);
        }
    });

    if (rangesToClear.length > 0) {
        sheet.getRangeList(rangesToClear).setValue('');
        Logger.log('変更フラグをクリアしました: ' + rangesToClear.length + '件');
    }

    if (rangesToSetSent.length > 0) {
        sheet.getRangeList(rangesToSetSent).setValue(true);
        Logger.log('送信済みフラグを設定しました: ' + rangesToSetSent.length + '件');
    }
}