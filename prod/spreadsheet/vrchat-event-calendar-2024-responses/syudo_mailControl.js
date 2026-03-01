/**
 * 開始時刻を過ぎてしまった未送信イベントのフラグをfalseに強制更新
 */
function updateFlagsForStartedEvents_Batch() {
  
  const SHEET_NAME = "フォームの回答 1"; 
  const HEADER_START_TIME = "開始日時"; 
  const HEADER_CHANGE_FLAG = "変更フラグ";
  const HEADER_SENT_FLAG = "送信済みフラグ";

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { return; }
  
  const colIndices = getColumnIndices(sheet, HEADER_START_TIME, HEADER_CHANGE_FLAG, HEADER_SENT_FLAG);
  if (colIndices === null) {
    Logger.log("エラー: ヘッダーが見つかりません。");
    return;
  }

  const COL_START_TIME = colIndices.targetTime; // 開始日時の列
  const COL_CHANGE_FLAG = colIndices.changeFlag;
  const COL_SENT_FLAG = colIndices.sentFlag;
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  const startRow = 2; // データ開始行

  // フラグ更新用の配列
  const changeFlagValues = allData.map(row => row[COL_CHANGE_FLAG - 1]);
  const sentFlagValues = allData.map(row => row[COL_SENT_FLAG - 1]);
  
  const now = new Date();
  const nowTime = now.getTime();

  let updatedCount = 0;
  
  for (let i = startRow; i <= allData.length; i++) {
    const dataIndex = i - 1;
    const row = allData[dataIndex];
    
    // 1. 変更フラグがtrueでないならスキップ
    if (row[COL_CHANGE_FLAG - 1] !== true) {
        continue;
    }
    
    // 2. 開始日時の取得
    const startTimeValue = row[COL_START_TIME - 1];
    if (!startTimeValue) { continue; }
  
    const eventStartTime = new Date(startTimeValue);

    // 3. 現在時刻が「開始時刻」を過ぎているか判定
    if (eventStartTime.getTime() < nowTime) {
      // falseを代入（falseがあるものはバッチ処理がされたイベント）
      changeFlagValues[dataIndex] = false; 
      sentFlagValues[dataIndex] = true;
      updatedCount++;
    }
  }

  // 一括書き込み
  if (updatedCount > 0) {
    const rowCount = allData.length;
    sheet.getRange(1, COL_CHANGE_FLAG, rowCount, 1).setValues(changeFlagValues.map(v => [v]));
    sheet.getRange(1, COL_SENT_FLAG, rowCount, 1).setValues(sentFlagValues.map(v => [v]));
  }
  
  Logger.log(`処理完了。開始時刻を過ぎた ${updatedCount} 件のフラグを強制更新しました。`);
}

/**
 * 列インデックス取得用補助関数（引数名を汎用的に変更）
 */
function getColumnIndices(sheet, timeHeader, changeFlagHeader, sentFlagHeader) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const indices = {
    targetTime: -1,
    changeFlag: -1,
    sentFlag: -1
  };
  
  headerRow.forEach((header, index) => {
    const colNum = index + 1;
    if (header === timeHeader) {
      indices.targetTime = colNum;
    } else if (header === changeFlagHeader) {
      indices.changeFlag = colNum;
    } else if (header === sentFlagHeader) {
      indices.sentFlag = colNum;
    }
  });

  if (indices.targetTime === -1 || indices.changeFlag === -1 || indices.sentFlag === -1) {
    return null;
  }
  return indices;
}