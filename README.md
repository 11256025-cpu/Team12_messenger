# Team12 Messenger

## GitHub

https://github.com/leonjyentub/MyChatApp.git

## 組員

- 11256008 劉晉成
- 11256011 林禹丞
- 11256025 胡凱程
- 11256046 廖唯廷

## 功能

- Email 註冊與登入
- 未登入會自動跳轉到登入頁，登入後進入 tab 頁
- 可用名字、Email 或 UID 搜尋使用者並加入好友
- 好友列表與聊天室列表分開顯示
- 每個好友有獨立聊天室與獨立訊息紀錄
- 聊天室列表會顯示最後一筆訊息與時間
- 訊息會顯示傳送時間
- Firestore 即時監聽聊天室與訊息，雙方畫面可半即時更新
- 帳號設定可修改名字、密碼與頭像
- 頭像上傳到 Firebase Storage

## 測試提醒

Firebase Console 需啟用 Authentication 的 Email/Password、Cloud Firestore 與 Firebase Storage。
建議至少註冊三個帳號，互相搜尋並加入好友後測試聊天。

## Firebase Rules

本專案已提供：

- `firestore.rules`
- `storage.rules`
- `firebase.json`
- `.firebaserc`

若出現 `Missing or insufficient permissions`，代表 Firebase 規則尚未部署。
登入 Firebase CLI 後可執行：

```bash
npx firebase-tools deploy --only firestore:rules,storage --project chatapp-team12-ede47
```

也可以到 Firebase Console 的 Firestore Rules / Storage Rules 頁面，貼上專案中的 rules 檔內容後發布。
