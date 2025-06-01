function onFormSubmit(e) {
  Logger.log(JSON.stringify(e)); // eオブジェクトの内容をログに出力

  var editResponseUrl = e.response.getEditResponseUrl(); // 編集リンクを取得
  Logger.log("編集リンク: " + editResponseUrl); // 編集リンクをログに出力

  var sheet = SpreadsheetApp.openById('1rPnRV15D_m69ai8bHZOVAFIu8W0kuSwoE-1saJEIfgM').getActiveSheet(); // スプレッドシートを取得
  var lastRow = sheet.getLastRow(); // 対象の行を取得

  // スプレッドシートの指定した列に編集リンクを記入
  sheet.getRange(lastRow, 22).setValue(editResponseUrl); // 16列目に編集リンクを追加（必要に応じて変更）
}