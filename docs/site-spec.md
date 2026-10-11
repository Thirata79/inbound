# 公式サイト仕様（Tokyo Zazen Studio, v0）

目的：OTA審査での事業確認、Google Business Profileのリンク先、OTAから名前で検索した人の直販への受け皿。
1ページ・英語・静的HTML（`site/`）。Netlifyで公開。写真はテスト回のあとで差し替える。

## design
- 雰囲気：静か、余白が広い、和紙と墨。「AIっぽい」グラデーションやアイコンの多用はしない。
- 色：生成り `#F6F3EC`（背景）、墨 `#1F1D1A`（文字）、灰 `#6B665E`（補足）、苔 `#5E6B4E`（アクセント1色のみ）。
- 書体：見出し Cormorant Garamond、本文 Source Sans 3。本文18px・行間1.75。
- レイアウト：最大幅 720px の1カラム。セクション間は大きく空ける。スマホ優先。
- 画像：今は墨の円相（SVG）のみ。写真はテスト回のあと `site/img/` に追加する。

## content（上から順）
1. ヒーロー：Tokyo Zazen Studio／Zen meditation in English, in a small group／予約リクエストへのボタン
2. What you'll do：導入 → 坐禅① → 歩行（経行） → 坐禅② → Q&A
3. Details：75分、最大6名、9,000円/人、火・木、江東区（清澄白河・門前仲町）、服装、初心者可
4. Your teacher：Rob Daoust（英語で直接指導）※経歴はRobertの確認後に追記
5. FAQ
6. 予約リクエスト（GASのWebアプリにJSONPで送信。`gas/`）
7. フッター：運営者

## 掲載の確認（2026-10-09 済み）
- Robertの名前・写真・紹介文・エリア表記はすべて許可済み。`noindex` は外した（検索に出してよい）。
- 木曜は法人の確認（休参日の使用）とRobertの15:30の都合が取れるまで「coming soon」と表記し、予約も受けない（`gas/Code.gs` の `OPEN_DAYS_DEFAULT`）。
- 運用の手順は `docs/site-admin.md`。
