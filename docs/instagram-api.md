# Instagram API を一度試す手順（2026-10-18）

**結果（2026-10-18 23時）：成功。** 読み取りと投稿（zazen-rob.jpg）ができた。アプリ `tokyozazen-test`（Instagram API with Instagram Login）、@tokyozazen を Instagram Tester に追加して承認する必要があった。

目的：@tokyozazen を API で読み書きできるか、一度だけ試す。常用はしない（投稿は月数回なので、予約は Meta Business Suite で足りる）。

- 使うのは「Instagram API with Instagram Login」。Facebookページは不要。プロアカウントであること。
- このリポジトリの作業環境（クラウド）からは graph.instagram.com に接続できないので、**TのMacのターミナルで実行する**。
- **アクセストークンは秘密。** チャット・リポジトリ・スクショに載せない。漏れたら Meta の画面で作り直す。

## 1. アプリを作り、トークンを出す（10〜15分）
1. https://developers.facebook.com/apps を info@takeshihirata.com のMetaアカウントで開く → 「アプリを作成」
2. ユースケースは「Instagramでメッセージとコンテンツを管理」（Instagram API）を選ぶ。アプリ名は `tokyozazen-test` など
3. アプリの画面で「Instagram」→「Instagramログインによる API 設定」→「アクセストークンを生成」→「アカウントを追加」で @tokyozazen にログインして許可
4. 表示されたトークン（長い英数字）をコピーする。有効期限は約60日

## 2. 読み取り（安全。何も変わらない）
Macのターミナルで：

```sh
TOKEN='ここにトークン'
curl -s "https://graph.instagram.com/me?fields=user_id,username,account_type,media_count,followers_count&access_token=$TOKEN"
```

`"username":"tokyozazen"` が返れば成功。

最近の投稿の一覧：

```sh
curl -s "https://graph.instagram.com/me/media?fields=id,caption,media_type,permalink,timestamp&access_token=$TOKEN"
```

## 3. 投稿（実際にフィードに載る）
画像は公開URLで渡す。縦横比は 4:5〜1.91:1 の JPEG。サイトの `img/zazen-rob.jpg`（1600×1200）が使える。`img/rob-daoust.jpg`（3:4）は縦長すぎて不可。

zsh では `#` の行を貼るとエラーになるので、コメントなしで1行ずつ実行する。番号は手で写さず、変数 `ID` に入れて受け渡す（写し間違いで「メディアビルダーが見つかりません」になった）。

```sh
ID=$(curl -s -X POST "https://graph.instagram.com/me/media" --data-urlencode "image_url=https://tokyozazen.com/img/zazen-rob.jpg" --data-urlencode "caption=Zazen in a quiet Tokyo dojo, taught in English or French. Small groups of up to 8. Link in profile." -d "access_token=$TOKEN" | sed -E 's/.*"id":"([0-9]+)".*/\1/'); echo $ID
curl -s "https://graph.instagram.com/$ID?fields=status_code&access_token=$TOKEN"
curl -s -X POST "https://graph.instagram.com/me/media_publish" -d "creation_id=$ID" -d "access_token=$TOKEN"
```

2行目で `"status_code":"FINISHED"` を確認してから3行目を実行する。
3行目で `{"id":"…"}` が返れば、投稿が公開されている。不要ならアプリから削除する（API では削除できない）。

## うまくいかないとき
- `Invalid OAuth access token`：トークンのコピー漏れか期限切れ。作り直す
- `(#10) Application does not have permission`：トークン作成時の権限に「content publish」が入っていない。作り直すときに許可する
- 画像のエラー：URLをブラウザで開いて画像が出るか、縦横比を確認
