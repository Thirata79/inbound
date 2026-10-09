# content.md — Tokyo Zazen Studio（v1 リデザイン用）

> どのセクションに、どの文言を、どの順で載せるかの設計図。サイト本文は英語、このファイルの説明は日本語。
> 不明な箇所は `[要確認]`。テスト回のあとに埋まる箇所は `[テスト回後]`。
> 事実の出典：`CLAUDE.md`（Robertとの合意 2026-10-09）、`docs/site-spec.md`、現行の `site/index.html`（v0）。

## サイト基本情報

- **サイト名**：Tokyo Zazen Studio
- **サイト種別**：1ページのLP（＋送信完了ページ、法務ページ2つ）
- **ターゲット**：東京に来ている英語話者の旅行者。坐禅は初めて。1人旅か2〜3人。滞在中の平日の昼に1〜2時間空いている。OTAで見つけて、名前で検索してきた人も含む。
- **CV（訪問者にしてほしい行動）**：予約リクエストの送信（その後、確定メールの支払いリンクから支払い）
- **サブCV**：OTAのレビューを見に行く（レビューが10件たまってから出す）
- **トーン**：静か、短い文、誇張しない。"authentic", "life-changing" のような売り文句は使わない。二人称（you）で話しかける。
- **表記ルール**
  - 時刻は24時間表記（9:30, 13:30）。曜日は Tuesdays / Thursdays。
  - 金額は ¥9,000（円記号＋カンマ）。
  - 用語：zazen（斜体なし・小文字）、kinhin（初出だけ説明を添える）、dojo。
  - 英国式か米国式かは混ぜない → **英国式**（organised, practise）で統一。v0に合わせる。
- **出してはいけないこと**
  - 道場（法人）の名前・住所。エリアは「江東区、清澄白河・門前仲町の近く」まで。
  - 宗教勧誘と取られる表現。
  - Robertの経歴は、本人が確認したものだけ。

## サイトマップ

| ページ | パス | 目的 | 優先度 |
|---|---|---|---|
| トップ（LP） | `/` | 体験を理解してもらい、予約リクエストを送ってもらう | 高 |
| 送信完了 | `/thanks.html` | v1ではページ内表示に置き換えるので不要 | 低 |
| プライバシーポリシー | `/privacy.html` | フォームで個人情報を集めるので必要 | 中 `[要確認]` |
| 特定商取引法に基づく表記 | `/legal.html` | 直販で前払いを受けるので必要 | 高 |

## 共通要素

### ヘッダー
- ロゴ：テキストロゴ「Tokyo Zazen Studio」＋円相のマーク（SVG）
- ナビ項目：The session / Details / Teacher / FAQ（スマホではナビを出さない）
- CTAボタン：「Request a session」→ `#book`（スクロールしたら固定表示）

### フッター
- 掲載項目
  - Tokyo Zazen Studio · Koto City, Tokyo
  - Sessions for visitors are organised by Takeshi Hirata.
  - 連絡先：`[要確認]`（メールアドレスを出すか。出すならフォームと同じ受信先）
  - Privacy / Legal notice へのリンク
- コピーライト表記：© 2026 Takeshi Hirata

### メタ情報
- **title**：Tokyo Zazen Studio — Zen Meditation in English
- **description**：A 75-minute Zen meditation (zazen) session in Tokyo, taught directly in English by a Zen teacher. Small groups of up to 6. Beginners welcome.
- **OGP**：og:title は title と同じ。og:description「75 minutes of zazen in a quiet Tokyo dojo. Taught in English, small groups, beginners welcome.」
- **OGP画像**：`og-zendo.jpg`（1200×630、写真11か1から作る）`[テスト回後]`
- **構造化データ**：入れない（住所を出さないので LocalBusiness は使えない）

---

## トップページ `/`

### セクション1：ヒーロー
- **eyebrow**：Zen meditation in Tokyo
- **キャッチコピー（h1）**：Tokyo Zazen Studio
- **サブコピー**：Sit quietly in a Tokyo dojo and learn zazen, taught directly in English.
- **CTAボタン**：ラベル「Request a session」→ `#book`
- **要点（4つ並べる）**：75 minutes / Up to 6 people / Beginners welcome / ¥9,000 per person
- **画像**：1枚 / 全員が坐禅を組んでいる正面、またはRobertが一人で坐っている姿 / PCは横長16:9、スマホは縦長4:5にトリミング → `hero-zendo.jpg` `[テスト回後]`
  - 写真が入るまでは円相のみ（v0と同じ）

### セクション2：Why this session（v1で追加）
- **eyebrow**：Why this session
- **見出し**：A first sitting, explained in your language
- **項目（3つ）**
  1. **Guided in English** — Your teacher explains every step in English, with no interpreter in between.
  2. **A small group** — Never more than six people, so there is time for each person's posture and questions.
  3. **Fits a travel day** — 75 minutes on a weekday, morning or afternoon. Free cancellation up to 24 hours before.
- **画像**：なし（文字だけで余白を見せる）

### セクション3：The session（流れ）
- **eyebrow**：The session
- **見出し**：What you'll do
- **リード**：No experience is needed. Your teacher guides you step by step, in English, with no interpreter in between.
- **ステップ（5つ、番号つき）**
  1. **Introduction** — How to sit, how to breathe, and what zazen is.
  2. **First sitting** — Your first period of seated meditation.
  3. **Walking meditation** — Kinhin: slow, mindful walking between sittings.
  4. **Second sitting** — A second period of zazen, now that you know the way.
  5. **Questions** — Ask anything about Zen, meditation, or keeping a practice at home.
- **各ステップの所要時間**：`[テスト回後]`（テスト回で計った時間を入れる。例「15 min」）
- **画像**：3枚 / 導入（写真7）、姿勢を直す手元（写真8）、経行（写真9）/ 3:2 → `session-intro.jpg`, `session-posture.jpg`, `session-kinhin.jpg` `[テスト回後]`

### セクション4：Details
- **eyebrow**：Practical information
- **見出し**：Details
- **表（項目／内容）**
  | 項目 | 内容 |
  |---|---|
  | Duration | 75 minutes |
  | Group size | Up to 6 people |
  | Price | ¥9,000 per person |
  | Times | Tuesdays at 9:30, 11:30, 13:30 and 15:30 / Thursdays at 9:30, 12:30 and 15:30 `[要確認：木15:30はRobertの都合、木曜の使用は法人に確認中]` |
  | Location | Koto City, Tokyo, near Kiyosumi-shirakawa and Monzen-nakacho stations. The exact address is sent with your booking confirmation. |
  | What to wear | Loose, comfortable clothing you can sit cross-legged in. Shoes are removed inside. |
  | Language | English |
  | Cancellation | Free cancellation up to 24 hours before the session. |
- **画像**：1枚 / 坐蒲が並んだ様子（写真2）/ 3:2 → `details-cushions.jpg` `[テスト回後]`

### セクション5：Your teacher
- **eyebrow**：Your teacher
- **見出し**：Rob Daoust
- **本文**
  - Rob practises and teaches zazen at a Zen dojo in Tokyo, and he guides every session himself, in English. He has welcomed visitors and international groups to the dojo before.
  - Sessions are kept small so that he can give each person attention, from posture to breathing to the questions that come up while sitting.
  - 経歴（坐禅歴、出身、来日年など）：`[要確認：Robert本人の確認後に追記]`
- **画像**：1枚 / `rob-daoust.jpg`（既存、3:4縦）。テスト回で坐禅姿（写真5）が撮れたら差し替えを検討

### セクション6：Voices（v1で追加、レビューがたまってから表示）
- **eyebrow**：From past guests
- **見出し**：What guests say
- **項目**：引用2〜3件（本文1〜2文＋名前のイニシャルと国。例「— A., Australia」）`[テスト回後]`
- **リンク**：「Read more reviews」→ OTAのページ `[レビュー10件後]`
- 引用がないうちはセクションごと出さない

### セクション7：FAQ
- **eyebrow**：Questions
- **見出し**：FAQ
- **Q&A（開閉式）**
  1. **I have never meditated. Is this for me?** — Yes. The session is designed for first-timers. Everything is explained before you sit.
  2. **Do I need to sit cross-legged on the floor?** — Zazen is usually done seated on a cushion. If sitting on the floor is difficult for you, tell us when you book and we will discuss options with you.
  3. **Is this a religious ceremony?** — No. You learn the practice of zazen itself. No belief or religious background is required.
  4. **Does the dojo hold other sittings?** — Yes. The dojo also holds its own regular sittings, guided in Japanese. This session is a separate introduction for visitors: guided in English from start to finish, in a small group, at times that fit a travel schedule, with time for your questions.
  5. **Can I come alone?** — Of course. Many people join on their own and sit with a small group.
  6. **Can I take photos?** — Photos are welcome before and after the session. During meditation we ask everyone to keep phones away.
  7. **How do I pay?**（v1で追加）— Once we confirm your time, we email you a secure online payment link. Your place is booked when payment is complete. Cancellations are free up to 24 hours before the session.
  8. **Can children join?**（v1で追加）— `[要確認：何歳から参加できるか]`

### セクション8：予約リクエスト（CV）
> 仕様の詳細は `docs/booking-requirements.md`（魚盛の予約ツールを流用。GAS + スプレッドシート）。ここには画面に出す文言だけを書く。

- **eyebrow**：Booking
- **見出し**：Request a session
- **リード**：Choose a date and time. We will reply within 24 hours to confirm, then send a secure payment link. Your place is booked once payment is complete.
- **価格の帯**：¥9,000 per person · 75 minutes · up to 6 people（人数を選ぶと「Total: ¥18,000」のように合計を出す）
- **フォーム項目**
  | 項目 | 種類 | 必須 |
  |---|---|---|
  | Date | カレンダー（受付中の日だけ選べる） | ○ |
  | Time | 選んだ日の枠から選ぶ | ○ |
  | Number of people | 1〜6（初期値2） | ○ |
  | Full name | text | ○ |
  | Email | email | ○ |
  | Country / region | text | ○ |
  | Preferred contact method | WhatsApp / LINE / SMS / Email only | ○ |
  | Phone number or ID | text。補助：Include your country code (e.g. +1, +44) | Email only 以外なら○ |
  | Where are you staying in Tokyo? | text | |
  | Can you sit on a cushion on the floor for about 20 minutes? `[テスト回後：1回の坐禅の時間]` | Yes / No / Not sure | ○ |
  | Anything else we should know? | textarea | |
  | （スパム対策）website | 隠しフィールド | |
- **床に座れない人への注記**（No / Not sure を選んだとき）：We will contact you to discuss options, such as sitting on a low bench or chair. `[要確認：会場に椅子があるか]`
- **確認チェック**
  - I understand this is a request, not a confirmed booking.
  - I understand that payment is made online after confirmation, and that cancellations are free up to 24 hours before the session.
- **送信ボタン**：Send request
- **送信後（同じ画面）**：Thank you. Your request number is {id}. We will reply within 24 hours.
- **失敗したとき**：Something went wrong. Please try again, or email us at `[要確認：窓口アドレス]`.
- **プライバシーポリシー**：ボタンの下に「By sending this form you agree to our Privacy Policy.」とリンク
- 送信後はページ内で完了を表示するので、`/thanks.html` は使わなくなる。JSが動かないときは `<noscript>` で「Email us at [窓口アドレス] to book」と出す

---

## 送信完了 `/thanks.html`

- **見出し**：Thank you
- **本文**：Your request has been received. We will reply by email within 24 hours.
- **リンク**：Back to Tokyo Zazen Studio → `/`
- `noindex`

## プライバシーポリシー `/privacy.html` `[要確認]`
- 集める情報：名前、メール、国、連絡手段とID、滞在先、希望日時、人数、メッセージ
- 目的：予約の確認と連絡のみ
- 第三者提供：しない（OTA経由の予約は各OTAの規約による）
- 保存先：Google スプレッドシート（T のアカウント）、メール。支払いは Stripe（カード情報は当方に届かない）
- 問い合わせ先：運営者 Takeshi Hirata、連絡先 `[要確認]`

## 特定商取引法に基づく表記 `/legal.html`
- 直販で Stripe の前払いにするので **必要**。販売事業者名（平田武）、所在地・電話番号（請求があれば遅滞なく開示する旨の記載で足りるか確認）、価格、支払方法・時期、キャンセル規定。

---

## 必要な画像の一覧

写真の番号は `docs/test-session/shot-list.md` の番号。

| ID | 用途 | 枚数 | アスペクト比 | 素材の有無 | ファイル名（予定） |
|---|---|---|---|---|---|
| hero | ヒーロー | 1 | 16:9（スマホ 4:5） | 無 → テスト回の写真11か5 | `hero-zendo.jpg` |
| session | 流れ（導入・姿勢・経行） | 3 | 3:2 | 無 → 写真7・8・9 | `session-intro.jpg` ほか |
| details | Details の横 | 1 | 3:2 | 無 → 写真2 | `details-cushions.jpg` |
| teacher | 講師 | 1 | 3:4 | **有** | `rob-daoust.jpg` |
| og | SNS共有 | 1 | 1200×630 | 無 → hero から作る | `og-zendo.jpg` |

- 画像の生成AIは使わない（実在の体験の写真でないと、OTAとレビューで不利になる）。
- 文字を入れた写真は使わない。顔が写る参加者は同意書（`photo-consent.md`）がある人だけ。

## 法務・必須掲載事項

- [ ] プライバシーポリシー
- [ ] 特定商取引法に基づく表記（直販で前払いを受けるので必要）
- [x] 運営者名の明記（フッター）
- [ ] 道場（法人）の名前を出していないことの確認
