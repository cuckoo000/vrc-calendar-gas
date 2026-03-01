function onFormSubmit(e) {
  Utilities.sleep(1000); // 競合回避のため待機

  var editResponseUrl = e.response.getEditResponseUrl();
  
  // スプレッドシートをIDから取得
  var sheet = SpreadsheetApp.openById('1rHTVTMSDbWq9XDY1dkAY7Sr99TNvlz35DuupZsgaRoE').getActiveSheet(); 
  var lastRow = sheet.getLastRow(); 
  
  // 修正URLのターゲットセルを取得
  var confirmedUrlCell = sheet.getRange(lastRow, 2);

  // 修正URL列が空欄の場合（＝初回登録時）のみ書き込む
  if (!confirmedUrlCell.getValue()) {
    // 修正URL列に書き込む
    confirmedUrlCell.setValue(editResponseUrl);
    Logger.log("編集リンクを書き込み完了");
  } else {
    Logger.log("B列に値、書き込みをスキップ");
  }
}