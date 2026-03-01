// =============================================
// えーじぇんとによる記述
// この画面上部の「実行」を押すと1日の残りの送信可能メール数を確認できます
// 返される値は現在の実行に対して有効(実行ボタンを押したアカウントから見たメール送信残数)
// 参考URL：https://developers.google.com/apps-script/reference/mail/mail-app?hl=ja#getremainingdailyquota
// =============================================
function mailcheck() {
  const emailQuotaRemaining = MailApp.getRemainingDailyQuota();
  console.log("残りのメール送信数: " + emailQuotaRemaining);
}