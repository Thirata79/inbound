# Tokyo Zazen Studio 予約リクエスト 要件定義書

Claude Code 用の実装指示書。四代目 魚盛の英語予約フォーム（Drive「reservation-requirements-en.md」, 2026-08）を坐禅向けに作り直したもの。
本書に書かれていない仕様は実装せず、確認を求めること。未確定の値は ○ のまま扱い、推測で埋めないこと。

-----

## 1. 目的とスコープ

公式サイト（Tokyo Zazen Studio）からの直販の予約を英語で受け付ける。

**やること**
- `site/index.html` の `#book` に置く予約リクエストフォーム（今の Netlify Forms を置き換える）
- 申し込みデータの蓄積（Google スプレッドシート）
- 申込者への自動メール：受付・確定（支払いリンクつき）・不可・前日リマインド・体験後のお礼
- Robert への前日の人数連絡
- 月末の Robert への精算額の集計に使える台帳

**やらないこと**
- 空席数の表示・自動確定
- サイト上でのカード決済（Stripe の Payment Link に飛ばすだけ）
- 会員ログイン・マイページ
- OTA との API 連携（OTA の予約は T が手で台帳に入れる）

-----

## 2. 最重要の設計方針

### 2.1 正の台帳は複数ある。だから自動で確定しない
同じ枠を OTA（複数）と直販で売る。各 OTA にそれぞれ在庫がある。
- 本フォームは **申し込みの受付窓口**。空席の判定はしない。判定するのは「その日・その時間が受付中か」だけ
- 確定は T が OTA の予約状況を見てから、シートの status を変えて行う
- UI に必ず出す：This is a request, not a confirmed booking. We will reply within 24 hours.
- 1枠の定員は 6 名。直販を確定したら、T が各 OTA の在庫を手で減らす

### 2.2 T の作業を増やさない（週3時間以内）
- T の手作業は「status を変える」「OTA の予約を台帳に1行入れる」「OTA の在庫を減らす」だけ
- メール送信・リマインド・Robert への連絡・月末集計は自動
- Robert に新しい作業を増やさない。Robert が受け取るのは前日のメール1通だけ

### 2.3 開催日はルールではなくデータ
木曜（会場の休参日）、祝日、接心会の翌日、Robert の休み（2週間前までに連絡）が不規則に入る。
- コードに曜日のルールを書かない。`calendar` シートを唯一の情報源にする
- ただし毎月ゼロから書き写すのは T の負担なので、**下書きを作る関数**（6.5）で火・木の行を先に入れ、T は休みの日のチェックを外すだけにする

-----

## 3. システム構成

```
[公式サイト site/index.html（Netlify）]
   └ 予約フォーム（素の HTML + JS）
        │  GET  ?action=calendar  → 受付中の日と時間
        │  POST action=reserve    → 申し込み
        ▼
[Google Apps Script Web アプリ]
        ▼
[Google スプレッドシート「Tokyo Zazen Studio 予約」]
   ├ reservations
   ├ calendar
   └ settlement（月末集計）
        ├→ MailApp：申込者への自動メール（英語）
        ├→ MailApp：T への通知（日本語）
        └→ MailApp：Robert への前日連絡（英語）
```

- スプレッドシートと GAS は T のアカウント（info@takeshihirata.com）に作る ○
- 外部サービスは Stripe の Payment Link だけ。有料 API は使わない

-----

## 4. データ設計

列構成は setup.gs の `setupSheets()` で作る。作ったあとに列を変えないこと。

### 4.1 reservations

| 列 | キー | 備考 |
|---|---|---|
| A | id | `Z-YYYYMMDD-001`（開催日ベース）。GAS で採番。OTA の行は T が `OTA-` で始まる番号を入れる |
| B | submitted_at | 受付日時 |
| C | status | 新規 / 確定 / 支払済 / 不可 / キャンセル / 参加済 / No-show。初期値 新規 |
| D | session_date | |
| E | session_time | `9:30` 形式の文字列 |
| F | party_size | 1〜6 |
| G | name | |
| H | email | |
| I | country | |
| J | contact_type | whatsapp / line / sms / email_only |
| K | contact_id | 国番号つきの電話番号、または ID |
| L | hotel | 滞在先（任意）。流入の分析に使う |
| M | floor_ok | yes / no / unsure（床に座れるか） |
| N | notes_guest | |
| O | source | 直販は utm_source、なければ direct。OTA の行は gyg / viator / klook など |
| P | amount_jpy | 9000 × party_size。OTA の行は空でよい |
| Q | mail_confirmed_at | 確定 / 不可メールの送信日時 |
| R | mail_reminded_at | 前日リマインドの送信日時 |
| S | mail_thanked_at | お礼メールの送信日時 |
| T | notes_staff | 手入力。「OTA在庫 減らした」などの確認にも使う |

### 4.2 calendar

| 列 | キー | 備考 |
|---|---|---|
| A | date | |
| B | accepting | チェックボックス。TRUE の日だけ選べる |
| C | time_slots | `9:30,11:30,13:30,15:30` のようなカンマ区切り |
| D | memo | 休みの理由など |

calendar に無い日付は受付不可。

### 4.3 settlement（月末集計、6.6 で自動作成）

| 列 | キー |
|---|---|
| A | month（YYYY-MM） |
| B | session_date |
| C | session_time |
| D | persons（参加済 + No-show + 24時間以内のキャンセル） |
| E | 備考 |

Robert への支払いは、参加済に加えて無断欠席・24時間以内のキャンセル分も対象（2026-10-09 合意）。1人あたりの単価と累進は `docs/rob-checklist.md` に従い、計算はシートの式で行う ○

-----

## 5. フロントエンド要件（site/index.html）

### 5.1 実装上の制約
- 素の HTML / CSS / JS。ライブラリやビルドは使わない
- 色・書体は `docs/site-spec.md`（のちに `docs/design/design.md`）に従う。新しい色を作らない
- localStorage / sessionStorage は使わない
- 表示はすべて英語。英国式の綴り（organised, practise）
- JS が動かないときは「Email us at ○ to book」と出す（`<noscript>`）

### 5.2 設定値（スクリプトの先頭に定数で置く）

| 定数 | 用途 |
|---|---|
| ENDPOINT | GAS Web アプリの URL |
| SHARED_KEY | GAS 側と照合するキー。ブラウザに出るので秘密ではない。スパムよけ程度の意味しかない |
| MAX_PARTY | 6 |
| FALLBACK_EMAIL | 通信に失敗したときに出す連絡先 ○ |

### 5.3 入力項目

| キー | ラベル | 必須 | 形式 |
|---|---|---|---|
| session_date | Date | ✓ | カレンダー。受付中の日だけ選べる |
| session_time | Time | ✓ | 選んだ日の time_slots から作る |
| party_size | Number of people | ✓ | 1〜6、初期値 2 |
| name | Full name | ✓ | |
| email | Email | ✓ | 形式チェック |
| country | Country / region | ✓ | |
| contact_type | Preferred contact method | ✓ | WhatsApp / LINE / SMS / Email only |
| contact_id | Phone number or ID | 条件つき | email_only 以外なら必須。補助テキスト：Include your country code (e.g. +1, +44) |
| hotel | Where are you staying in Tokyo? | — | |
| floor_ok | Can you sit on a cushion on the floor for about 20 minutes? | ✓ | Yes / No / Not sure ○（時間はテスト回で計ってから） |
| notes_guest | Anything else we should know? | — | |
| ack_request | 確認チェック | ✓ | 5.5 |
| ack_payment | 確認チェック | ✓ | 5.5 |

- 電話番号を必須にしない（来日前の人は日本の番号を持っていない）
- floor_ok が No / Not sure のときは送信前に注記を出す：We will contact you to discuss options, such as sitting on a low bench or chair. ○（会場に椅子・坐禅椅子があるか Robert に確認）

### 5.4 価格の表示
フォームの上に固定で出す：`¥9,000 per person · 75 minutes · up to 6 people`。人数を選んだら合計（例 `Total: ¥18,000`）を出す。

### 5.5 確認チェック（送信の条件）
```
[ ] I understand this is a request, not a confirmed booking.
[ ] I understand that payment is made online after confirmation,
    and that cancellations are free up to 24 hours before the session.
```

### 5.6 状態の遷移
idle → submitting → success / error
- 送信中はボタンを無効にする（二重送信を防ぐ）
- 成功したらフォームを閉じ、受付番号と `We will reply within 24 hours.` を出す
- 失敗したら入力を残したまま再送信できるようにし、FALLBACK_EMAIL を必ず出す
- カレンダーの取得に失敗したら、日付欄の代わりに FALLBACK_EMAIL への案内を出す

### 5.7 スパム対策
- 非表示の入力欄 `website`（ハニーポット）。値があれば送らずに成功を装う
- 同じページから 60 秒以内の連続送信を止める

-----

## 6. バックエンド要件（Google Apps Script）

### 6.1 CORS（魚盛で確認済みの落とし穴）
- POST は `Content-Type: text/plain;charset=utf-8` で送り、GAS 側で `JSON.parse(e.postData.contents)`
- レスポンスは `ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON)`
- デプロイ：実行するユーザー＝自分、アクセスできるユーザー＝全員
- コードを変えたら **新しいバージョンで再デプロイ** しないと反映されない
- fetch の redirect は既定の follow のまま

### 6.2 doGet：受付中の日と時間
リクエスト：`?action=calendar&key={SHARED_KEY}`
```json
{ "ok": true, "days": [ { "date": "2026-11-03", "slots": ["9:30", "11:30", "13:30", "15:30"] } ] }
```
- 今日から 90 日先までで、accepting = TRUE の日だけ返す
- 直近 ○ 日以内は返さない（受付の締切。暫定 2 日。T が24時間以内に返事をし、お客さんが支払う時間が要るため）
- CacheService で 10 分キャッシュしてよい

### 6.3 doPost：申し込み
ボディ：5.3 の項目 + `action: "reserve"` + `key`

**サーバー側で必ず検証する**
1. key が一致する
2. session_date が受付中の日である
3. session_time がその日の time_slots にある
4. party_size が 1〜6
5. 必須項目がそろっている
6. email の形式

**処理**
1. `LockService.getScriptLock()`（採番の競合を防ぐ。待つのは 10 秒）
2. id を採番して reservations に追記。amount_jpy = 9000 × party_size
3. T に通知メール（日本語）：日時・人数・名前・国・floor_ok・メモ。最後に「OTA の在庫を確認 → status を確定 / 不可に」と書く
4. 申込者に受付メール（英語）
5. ロックを解放

レスポンス：`{ "ok": true, "id": "Z-20261103-001" }`。失敗時は `{ "ok": false, "error": "INVALID_DATE" }` のようにコードで返し、文言はフロントで持つ。

### 6.4 定期トリガー（onEdit は取りこぼすので使わない。フラグ列を見る）

| トリガー | 頻度 | 対象 | 処理 |
|---|---|---|---|
| 確定 / 不可メール | 1時間ごと | status が 確定 または 不可、かつ mail_confirmed_at が空 | メールを送り、日時を記録 |
| 前日リマインド | 毎日 10:00 | status が 支払済、開催日が明日、mail_reminded_at が空 | 道順・服装・集合時刻を送る |
| Robert への前日連絡 | 毎日 18:00 | 開催日が明日で status が 支払済（直販）または OTA の行 | 枠ごとの人数と floor_ok が No / Not sure の人数だけを英語で送る。名前・連絡先は送らない（顧客情報は T が管理する合意） |
| お礼メール | 毎日 12:00 | status が 参加済、開催日が昨日、mail_thanked_at が空 | 6.7 |
| 月末集計 | 毎月1日 3:00 | 前月の行 | settlement シートに枠ごとの人数を書く |

- 支払いの確認：Stripe から T に届く支払い通知を見て、T が status を 支払済 にする（手作業）。確定から ○ 時間以内に支払いがなければ、T が キャンセル にして枠を戻す（暫定 48 時間。開催の 3 日前を切っていれば 24 時間）
- のちの改善：Stripe API を1時間ごとに見て、`client_reference_id` が一致する支払いがあれば自動で 支払済 にする。秘密鍵は Script Properties に置く。今回は作らない

### 6.5 calendar の下書き作成 `fillCalendar(months)`
- 手動で実行する関数。今日から months ヶ月先まで、火曜と木曜の行を足す（すでにある日付は上書きしない）
- 火：`9:30,11:30,13:30,15:30`、木：`9:30,12:30,15:30` ○（木 15:30 は Robert に確認中）
- **木曜は accepting を FALSE で入れる**。会場の休参日に使ってよいか法人に確認が取れたら TRUE に変える ○
- 日本の祝日（Google の公開カレンダー `ja.japanese#holiday@group.v.calendar.google.com`）は accepting を FALSE、memo に「祝日」
- 接心会の翌日と Robert の休みは T が手でチェックを外す

### 6.6 メール送信
- MailApp.sendEmail。送信元は T のアカウント、replyTo は窓口のアドレス ○
- HTML と plain text の両方
- 差出人の表示名：Tokyo Zazen Studio

### 6.7 お礼メールの中身
- お礼の一言、家で続けるためのひと言（Robert の言葉を入れる ○）
- レビューのお願い：直販の人は OTA にレビューを書けない。どこに書いてもらうかは ○（TripAdvisor などの候補。Google マップの既存の登録は法人のものなので使わない）

-----

## 7. メールの文面（すべて英語）

### 7.1 受付（自動・すぐ）
```
Subject: We received your request — Tokyo Zazen Studio

Thank you for your request. This is not yet a confirmed booking.
We will reply within 24 hours.

Request no.  {id}
Date         {session_date} {session_time}
People       {party_size}
Total        ¥{amount_jpy}

If you do not hear from us within 24 hours, please email ○.
```

### 7.2 確定（支払いリンクつき）
必ず入れるもの：
- 枠を確保したこと、**支払いが済むと予約が確定する**こと
- 日時・人数・合計額
- Stripe の Payment Link：`{PAYMENT_LINK}?client_reference_id={id}&prefilled_email={email}`
  - Payment Link は「¥9,000 × 数量（1〜6）」、お客さんが数量を変えられる設定にする ○
- 支払いの期限（6.4）
- キャンセル規定：24時間前まで無料、それ以降と無断欠席は返金なし
- 場所はエリアまで（江東区、清澄白河・門前仲町の近く）。正確な住所と道順は前日のリマインドで送る ○（確定時に送るかどうか T が決める）

### 7.3 不可
- その枠が埋まっていること
- 同じ週の別の枠を提案できる余地を残した固定の文（必要なら T が手で書き足す）

### 7.4 前日リマインド（支払済の人だけ）
- 日時・人数の再掲
- 住所と道順 ○（駅からの道順、入口の写真へのリンク）
- 服装：Loose, comfortable clothing you can sit cross-legged in. Shoes are removed inside.
- 何分前に来ればよいか ○
- 変更・キャンセルはこのメールに返信

### 7.5 お礼（翌日）
6.7 のとおり。

-----

## 8. 運用の流れ

1. お客さんがフォームを送る
2. T に通知メール
3. T が OTA の予約状況を見る
4. T が status を 確定 か 不可 に変える
5. 1時間以内に確定 / 不可メールが自動で届く（確定には支払いリンク）
6. 支払いの通知が来たら、T が status を 支払済 にし、各 OTA の在庫を減らす（notes_staff に「OTA在庫 済」）
7. OTA で予約が入ったら、T が reservations に1行入れる（id は OTA-、source に OTA の名前）
8. 前日：お客さんにリマインド、Robert に人数が自動で届く
9. 体験の後、T が status を 参加済 / No-show にする → 翌日お礼メール
10. 毎月1日：settlement に先月の人数が出る → Robert への支払い

T の手作業の見積もり：直販1件 3〜4分、OTA 1件 1分。月60人（約30件）なら月1.5〜2時間。

-----

## 9. 未確定の値（○ のまま残す）

- 窓口のメールアドレス（replyTo、FALLBACK_EMAIL）
- 受付の締切（暫定 2 日前）、支払いの期限（暫定 48 時間）
- Stripe の Payment Link（アカウント、数量の設定）
- 木曜の枠（法人の確認）、木 15:30（Robert の確認）
- 床に座れない人への対応（椅子があるか）と、坐禅の1回の時間
- 住所・道順の文面、何分前に来るか
- レビューを書いてもらう場所
- Robert への支払いの単価と累進の計算式

確定済みで実装に使ってよい値：

| 項目 | 値 |
|---|---|
| 料金 | ¥9,000 / 人 |
| 所要時間 | 75 分 |
| 定員 | 1枠 6 名、1 名から開催 |
| 枠 | 火 9:30・11:30・13:30・15:30、木 9:30・12:30・15:30 |
| キャンセル | 24 時間前まで無料 |
| エリア | 江東区、清澄白河・門前仲町の近く |
| 運営者 | Takeshi Hirata |

-----

## 10. 実装の順序

1. setup.gs：3 シートの作成と `fillCalendar()`
2. GAS：doGet → デプロイ → ブラウザで JSON が返ることを確認
3. フォーム：日付と時間の選択だけを作り、doGet とつなぐ
4. GAS：doPost（検証・採番・追記）
5. フォームの全項目と送信
6. 受付メールと T への通知
7. 定期トリガー（確定 / 不可 → 前日リマインド → Robert への連絡 → お礼 → 月末集計）
8. 文言の仕上げ、スマホでの確認

一つずつ動くことを確かめてから次に進む。まとめて作らない。

-----

## 11. 受け入れ条件

- 受付していない日がカレンダーで選べない
- 選んだ日に無い時間が選べない
- 必須項目が空のまま送れない。二重送信ができない
- 送ると reservations に1行だけ増える
- 申込者に英語の受付メールが届き、not a confirmed booking と書いてある
- T に通知メールが届く
- status を 確定 にすると、1時間以内に支払いリンクつきの確定メールが届く。同じメールが二度届かない
- 不正な key、存在しない日付、7人以上の POST が拒否される
- 前日 18:00 に Robert へ、名前を含まない人数だけのメールが届く
- 月末集計の人数に、No-show と24時間以内のキャンセルが含まれる
- スマホで入力から送信まで完結する。画面に日本語が出ない
