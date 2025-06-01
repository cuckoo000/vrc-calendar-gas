function createOrUpdateCalendarEvent(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var editedRow = e.range.getRow();  // 変更行の取得
  
  // 編集リンクがスプレッドシートに記載されない事象を緩和する為、取得する前に5秒待つ
  Utilities.sleep(5000);

  // 列名と列番号のマッピングを取得_最下部に関数を記載
  var columns = getColumnMapping(sheet);

// ログ出力：列マッピング確認用
Logger.log("列マッピング: " + JSON.stringify(columns));
Logger.log("開始日時の列番号: " + columns["開始日時"]);
Logger.log("終了日時の列番号: " + columns["終了日時"]);

//デバッグエリア
Logger.log("===== デバッグエリア =====");
Logger.log("シート名: " + sheet.getName());
Logger.log("編集行: " + editedRow);
Logger.log("列マッピング: " + JSON.stringify(columns));
Logger.log("===== 取得データ一覧 =====");
Logger.log("イベント名: " + eventName);
Logger.log("Android対応可否: " + android_pc);
Logger.log("メールアドレス: " + email);
Logger.log("イベント主催者: " + eOrganizer);
Logger.log("イベント内容: " + eDetails);
Logger.log("イベントジャンル: " + eGenre);
Logger.log("参加条件: " + eConditions);
Logger.log("参加方法: " + eMethod);
Logger.log("備考: " + eRemarks);
Logger.log("イベントID: " + eventId);
Logger.log("修正URL: " + editResponseUrl);
Logger.log("開始日時: " + startTime);
Logger.log("終了日時: " + endTime);
Logger.log("=========================");
 
// ★スプレッドシートのデータを取得///////////////
// ※フォームの改造などによりスプレッドシートの列名が追加・変更された場合はまずここを見る
  var eventName = sheet.getRange(editedRow, columns["イベント名"]).getValue();
  var android_pc = sheet.getRange(editedRow, columns["Android対応可否"]).getValue();
  var email = sheet.getRange(editedRow, columns["メールアドレス"]).getValue();
  var deleteCheckbox = sheet.getRange(editedRow, columns["イベントを登録しますか"]).getValue();
  var eOrganizer = sheet.getRange(editedRow, columns["イベント主催者"]).getValue();
  var eDetails = sheet.getRange(editedRow, columns["イベント内容"]).getValue();
  var eGenre = sheet.getRange(editedRow, columns["イベントジャンル"]).getValue();
  var eConditions = sheet.getRange(editedRow, columns["参加条件（モデル、人数制限など）"]).getValue();
  var eMethod = sheet.getRange(editedRow, columns["参加方法"]).getValue();
  var eRemarks = sheet.getRange(editedRow, columns["備考"]).getValue();
  //var eAnnounce = sheet.getRange(editedRow, columns["海外ユーザー向け告知"]).getValue();（2025年1月18日　byAJNT）
  //var xpost = sheet.getRange(editedRow, columns["X告知文"]).getValue();（2025年1月18日　byAJNT）
  var eventId = sheet.getRange(editedRow, columns["イベントID"]).getValue();
  var editResponseUrl = sheet.getRange(editedRow, columns["修正URL"]).getValue();
  
  // 開始日時と終了日時を日付オブジェクトとして取得
  var startTime = new Date(sheet.getRange(editedRow, columns["開始日時"]).getValue());
  var endTime = new Date(sheet.getRange(editedRow, columns["終了日時"]).getValue());

//★メール関係_初期設定_前項で取得した値を変数に格納///////////////
  var body;
  var cTitle = '';//（2025年1月25日　by 既存コードの変数を残している カッコウ ）
  var VRCTitle = '';
  var Quest = '';//（2025年1月25日　by 既存コードの変数を残している カッコウ）
  var mailStartTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "yyyy/MM/dd");
  var formattedStartTime = Utilities.formatDate(startTime, Session.getScriptTimeZone(), "yyyy年MM月dd日 HH時mm分");
  var formattedEndTime = Utilities.formatDate(endTime, Session.getScriptTimeZone(), "yyyy年MM月dd日 HH時mm分");

  //メール関係_タイトル_判定
  // Android対応可否の判別
      cTitle=eventName;
      VRCTitle=eventName;
    if(android_pc==="PC/android"){
      VRCTitle = '【Android 対応】' + VRCTitle;
      Quest = 'Android';
    }else if(android_pc==="android only"){
      VRCTitle = '【Android オンリー】' + VRCTitle;
      Quest = 'Android';
    }

  //メール関係_イベント名・時間セット
  var baseset = "";
  baseset += "イベント名: " + eventName;
  baseset += "\n開始日時: " + formattedStartTime;
  baseset += "\n終了日時: " + formattedEndTime;

  //メール関係_詳細
  var message = "";
  message += "【イベント主催者】\n" + "　" + eOrganizer;
  message += "\n【イベント内容】\n" + "　" + eDetails;
  message += "\n【イベントジャンル】\n" + "　" + eGenre;
  message += "\n【参加条件（モデル、人数制限など）】\n" + "　" + eConditions;
  message += "\n【参加方法】\n" + "　" + eMethod;
  message += "\n【備考】\n" + "　" + eRemarks;
  //下記項目はカレンダーへの反映不要（2025年1月10日　byカッコウ）
  //message += "\n【海外向け告知】\n" + "　" + eAnnounce;
  //下記項目はカレンダーへの反映不要（2025年1月10日　byカッコウ）
  //message += "\n【X告知文】\n" + "　" + xpost;
////////////////////////////////////////////////////////

  // カレンダー取得
  var calendar = CalendarApp.getCalendarById('6837aa0e09b99b8e9443aa0c4132920f0827d5aeb85b2a1c0768283ee04b8ab5@group.calendar.google.com');  

// ★イベント削除判定///////////////
  // 「イベントを削除する」が選択されている場合
  if (deleteCheckbox === "イベントを削除する") {
    if (eventId) {
      var event = calendar.getEventById(eventId);  
      if (event) {
        event.deleteEvent();  // イベントを削除
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();  // スプレッドシートのイベントIDを削除
      }
    }
    // 削除された旨のメールを送信
    var subject = "【VRChatイベントカレンダー】" + eventName +'の削除申請を受け付けました';
    var body = "イベント名「" + eventName +"」の削除申請を受け付けました。\n\n" +
               "イベントが削除されているか確認をお願いします。\n" +
               "https://vrceve.com/ \n\n" +
               "なお、イベントが削除されていない場合、処理が失敗している可能性があります。\n" +
               "5分以上経ってもカレンダーからイベントが消えていない場合は、再度削除申請を行ってください。\n\n" +
               "■イベント詳細■" + "\n" + message;
     
    MailApp.sendEmail(email, subject, body);
    return; // イベントが削除された場合、これ以降の処理をスキップ
  }

// ★日時による登録エラー判定///////////////
  // 今日の日付を取得し、時刻をクリア
  var today = new Date();
  today.setHours(0, 0, 0, 0); // 今日の日付を0時に設定

//----------------------------------------------------------------------
  // 「今日より開始日時が過去」の場合
  if (today > startTime) {
    // イベントIDが存在する場合、カレンダーのイベントを削除
    if (eventId) {
      var event = calendar.getEventById(eventId);
      if (event) {
        event.deleteEvent(); // イベントを削除
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();// スプレッドシートのイベントIDを削除
      }
    }
    // 登録できなかった旨のメールを送信
    var subject = "【イベント登録失敗通知】" + eventName +'はカレンダーに登録されていません';
    var body = "以下のイベントの開始日時が今日より過去の日付のため、カレンダーにイベントは表示されません。\n\n" +
                baseset + "\n\n" +
               "開始日時を未来の日付に修正してください。\n\n" +
               "以下のリンクをクリックして、回答を確認または修正できます:\n" + editResponseUrl;
     
    MailApp.sendEmail(email, subject, body);
    return;  // 今日より開始日時が過去であれば、これ以降の処理をスキップ
  }
//----------------------------------------------------------------------

  // 「終了日時より開始日時が未来」の場合
  if (endTime < startTime) {
    if (eventId) {
      // イベントIDが存在する場合、カレンダーのイベントを削除
      var event = calendar.getEventById(eventId);  
      if (event) {
        event.deleteEvent();  // イベントを削除
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();// スプレッドシートのイベントIDを削除
      }
    }
    // 修正依頼のメールを送信
    var subject = "【イベント日時の修正依頼】" + eventName +'はカレンダーに登録されていません';
    var body = "以下のイベントの終了日時が開始日時より前に設定されているため、カレンダーにイベントは表示されません。\n\n" +
                baseset + "\n\n" +
               "正しい終了日時に修正されるとカレンダーに登録されます。\n\n" +
               "以下のリンクをクリックして、回答を確認または修正できます:\n" + editResponseUrl;

    MailApp.sendEmail(email, subject, body);
    return; // 終了日時より開始日時が未来であれば、これ以降の処理をスキップ
  }

//----------------------------------------------------------------------
  //　「終了日時が開始日時より6時間以上後」の場合
  var timeDiff = (endTime - startTime) / (1000 * 60 * 60); // 時間差を計算
  if (timeDiff > 6) {
    // イベントIDが存在する場合、カレンダーのイベントを削除
    if (eventId) {
      var event = calendar.getEventById(eventId);  
      if (event) {
        event.deleteEvent();  // イベントを削除
        sheet.getRange(editedRow, columns["イベントID"]).clearContent();// スプレッドシートのイベントIDを削除
      }
    }
    // 修正依頼のメールを送信
    var subject = "【イベント時間の修正依頼】" + eventName +'はカレンダーに登録されていません';
    var body = "6時間を超えるイベントは、カレンダーに表示されません。\n\n" +
                baseset + "\n\n" +
               "正しい終了日時に修正されるとカレンダーに登録されます。\n\n" +
               "以下のリンクをクリックして、回答を確認または修正できます:\n" + editResponseUrl;

    MailApp.sendEmail(email, subject, body);
    return; // 終了日時が開始日時より6時間以上後であれば、これ以降の処理をスキップ
  }


//----------------------------------------------------------------------

// ★新規登録か既存イベントの変更かを判別してそれぞれ処理を行う///////////////
  var isNewEvent = false; // 更新または新規作成の判定用変数
  if (eventId) {
    // イベントIDが存在する場合、更新内容を更新する
    var event = calendar.getEventById(eventId);  
    if (event) {
      // イベントを更新
      event.setTitle(VRCTitle);
      event.setTime(startTime, endTime);
      event.setDescription(message);
      Logger.log('イベントが更新されました: ' + eventId);
    } else {
      Logger.log('指定されたイベントが見つかりませんでした。新しいイベントを作成します。');
    }
  } else {
    // イベントIDが存在しない場合、終了日時が開始日時より後であれば新しいイベントを作成
    if (endTime > startTime) {
      var newEvent = calendar.createEvent(VRCTitle,startTime,endTime,{description:message}).setGuestsCanSeeGuests(false);

      // スプレッドシートに新しいイベントIDを記載
      sheet.getRange(editedRow, columns["イベントID"]).setValue(newEvent.getId());
      Logger.log('新しいイベント作成: ' + newEvent.getId());
      isNewEvent = true;　// イベントが新規作成だった場合false→trueに変更
    }
  }
  
  // 新規作成か更新かによってメッセージを変更
  if (isNewEvent) { //isNewEventが「true」の場合
    subject = "【VRChatイベントカレンダー】" + eventName + "が登録されました(" + mailStartTime + ")";
    body = "新しいイベントが登録されました。\n\n" +
            baseset + "\n\n" +
           "■イベント詳細■" + "\n" +
            message + "\n\n" +
           "以下のリンクをクリックして、登録内容を確認または編集できます:\n" + editResponseUrl;
  } else { //isNewEventが「false」の場合
    subject = "【VRChatイベントカレンダー】" + eventName + "の内容が変更されました(" + mailStartTime + ")";
    body = "イベント内容が変更されました。\n\n" +
            baseset + "\n\n" +
           "■イベント詳細■" + "\n" +
            message + "\n\n" +
           "以下のリンクをクリックして、登録内容を確認または編集できます:\n" + editResponseUrl;
  }
  MailApp.sendEmail(email, subject, body);  // メールを送信
}

// スプレッドシートの列名で列番号を取得する関数
function getColumnMapping(sheet) {
  // sheetが存在しない場合のチェック
  if (!sheet) {
    return {};
  }
  var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var columns = {};

  // ヘッダー行の列名をキー、列番号を値としてマッピングを作成
  for (var i = 0; i < headerRow.length; i++) {
    var columnName = headerRow[i];
    if (columnName) {
      columns[columnName] = i + 1;
    }
  }
  return columns;
}