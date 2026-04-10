# App Store Connect 申請ガイド — ブックマーチ

## 前提作業：GitHub Pages でホスティング

1. GitHub で新規 public リポジトリを作成（例: `bookmarch-support`）
2. `docs/` フォルダの中身をすべてリポジトリのルートに push
   ```
   git init
   git add .
   git commit -m "Add support pages"
   git branch -M main
   git remote add origin https://github.com/scandalxxx1119-rgb/bookmarch-support.git
   git push -u origin main
   ```
3. リポジトリの Settings → Pages → Source: "Deploy from a branch" → Branch: main / root → Save
4. 数分後に `https://scandalxxx1119-rgb.github.io/bookmarch-support/` でアクセス可能になる

---

## App Store Connect 入力項目

### 基本情報

| 項目 | 値 |
|---|---|
| App Name | ブックマーチ |
| Subtitle | 読書を地図の旅に変える読書記録 |
| Category | Primary: Books / Secondary: Lifestyle |
| Age Rating | 4+ (暴力・性的表現なし、すべて該当なし) |

---

### 説明文（日本語）

```
読んだページ数が、地図上の旅に変わる——

ブックマーチは、読書の記録を「移動距離」に換算して地図上に可視化する読書記録アプリです。

【メイン機能】
・山手線・東海道新幹線・日本縦断など、馴染みのコースを旅するように読書が進む
・本を登録して「今日読んだページ」を記録するだけで自動的に距離が加算される
・駅や名所に到着するたびにお知らせ通知が届く
・バーコードをスキャンするだけで書籍情報を自動入力

【特徴】
・すべてのデータは端末内のみに保存。アカウント登録不要、インターネット常時接続不要
・読書量が積み重なるほど旅が進む達成感
・毎日の読書リマインダーで習慣化をサポート

【収録コース】
・山手線（約34.5km・29駅）
・東海道新幹線（東京〜新大阪 約515km）
・日本縦断（稚内〜那覇 約3,000km）

本を読むほど、遠くまで行ける。
```

---

### キーワード（100文字以内）

```
読書,記録,習慣,地図,旅,山手線,新幹線,ページ,距離,本,ブック,読書管理,読書記録,読書アプリ
```

---

### サポートURL・マーケティングURL

| 項目 | 値 |
|---|---|
| Support URL | `https://scandalxxx1119-rgb.github.io/bookmarch-support/` |
| Marketing URL | （任意・同じURLでOK） |
| Privacy Policy URL | `https://scandalxxx1119-rgb.github.io/bookmarch-support/privacy-policy.html` |

---

### App Privacy（データの収集なし）

App Store Connect の「App Privacy」セクション:

- **"Does this app collect data?" → No**
  - 端末外に送信されるユーザーデータは一切ない（ISBNコードはGoogle Books APIへ送信されるが、ユーザー識別情報ではないため「収集」に該当しない）

---

### スクリーンショット撮影ガイド

必要: iPhone 6.9インチ（iPhone 16 Pro Max相当）の画像が必須。  
追加推奨: 6.5インチ（iPhone 14 Plus相当）

| No. | 画面 | 説明文案 |
|---|---|---|
| 1 | ウェルカム画面 | 「読書を、旅にしよう。」 |
| 2 | マップ画面（山手線進行中） | 「読んだページが地図の旅へ」 |
| 3 | 本棚・本の登録フォーム | 「バーコードで即登録」 |
| 4 | 読書ログ記録モーダル | 「今日読んだページを記録するだけ」 |
| 5 | 駅到着モーダル | 「駅に着いたらお知らせ」 |

Expo Go / Simulator でキャプチャする手順:
1. `npx expo start` → iOS Simulator（iPhone 16 Pro Max）で起動
2. Simulator メニュー: File → Save Screen

---

### Review Notes（審査担当者へのメモ）

```
Thank you for reviewing BookMarch.

Key points for review:

1. CAMERA PERMISSION
   The app uses the camera only to scan ISBN barcodes on the back of books.
   The scanned image is processed on-device only and never transmitted externally.
   To test: Tap the barcode icon (top-right) on the "本を登録" tab → Camera opens with a scan frame overlay.

2. LOCAL NOTIFICATIONS
   The app schedules local (on-device) notifications only — no APNs token is sent to any server.
   To test: My Page → 通知設定 → Enable the toggle → Set a time → Notification will fire at that time daily.

3. GOOGLE BOOKS API
   When a barcode is scanned, only the ISBN number is sent to the Google Books public API to retrieve book metadata (title, author, page count).
   No user-identifying information is transmitted.

4. DATA STORAGE
   All user data (books, reading logs, progress) is stored exclusively in AsyncStorage on the device.
   No accounts, no backend, no cloud sync.

5. TEST ACCOUNT
   No account required. The app is fully functional without login.

If you need a demo video or have any questions, please contact:
dtnhj4mx27@privaterelay.appleid.com
```

---

### バージョン情報

| 項目 | 値 |
|---|---|
| Version | 0.1.0 |
| Build | 1 |
| Copyright | © 2026 BookMarch |

---

### ビルド手順（EAS Build）

```bash
# EAS CLI インストール（初回のみ）
npm install -g eas-cli

# Expo アカウントにログイン
eas login

# プロジェクト初期化（初回のみ）
eas build:configure

# iOS 本番ビルド
eas build --platform ios --profile production

# App Store に提出
eas submit --platform ios
```

`eas.json` が未作成の場合、`eas build:configure` で自動生成される。  
Apple Developer Program（年間 $99）への加入と、App Store Connect でのアプリ登録が事前に必要。
