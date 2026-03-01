function onFormSubmit(e) {
  Logger.log(JSON.stringify(e)); // eオブジェクトの内容をログに出力

  var editResponseUrl = e.response.getEditResponseUrl(); // 編集リンクを取得
  Logger.log("編集リンク: " + editResponseUrl); // 編集リンクをログに出力

  var sheet = SpreadsheetApp.openById('1khYEj0t3eI2LnYxgnN3uJUKHHQg8CJTk3JD3vITQlQc').getActiveSheet(); // スプレッドシートを取得
  var lastRow = sheet.getLastRow(); // 対象の行を取得

  // スプレッドシートの指定した列に編集リンクを記入
  sheet.getRange(lastRow, 16).setValue(editResponseUrl); // 16列目に編集リンクを追加（必要に応じて変更）
}