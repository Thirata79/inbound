# サイト管理（Tokyo Zazen Studio）

Tの作業は「予約シートを見る」だけにする。サイトのコードを直すときはClaude Codeに頼む。

## どこに何があるか
| もの | 場所 |
|---|---|
| 公開URL | https://tokyozazen.com/（XServerドメインで取得。旧 https://tokyo-zazen-studio.netlify.app/ は自動で転送） |
| Netlifyの管理画面 | https://app.netlify.com/projects/tokyo-zazen-studio |
| ページの中身 | `site/index.html`（1ページ）、写真は `site/img/` |
| 予約の受付・自動メール | Googleスプレッドシート「Tokyo Zazen Studio 予約」＋Apps Script（`gas/`、手順は `gas/README.md`） |

## 更新の流れ
1. Claude Codeに日本語で頼む（例：「木曜を開ける」「写真を差し替え」）。
2. Claudeがブランチで直してPRを出す → Tがマージ。
3. **本番ブランチ（GitHubの既定ブランチ `claude/elegant-brahmagupta-je7wbk`）** に入ると、Netlifyが1分ほどで自動公開する。
   - このリポジトリには `main` がない。既定ブランチの名前を変えたら、Netlifyの「Build & deploy → Branches → Production branch」も同じ名前にする。

## よくある変更と、どこを直すか
| やりたいこと | 直す場所 | Tがやること |
|---|---|---|
| 休みの日を作る | 予約シートの calendar で accepting のチェックを外す | 自分で（10分で反映） |
| 木曜を開ける（法人・Robertの確認後） | calendar の木曜の accepting をオン＋サイトの「Thursday sessions are coming soon.」を時間に戻す | Claudeに「木曜を開ける」 |
| 時間・枠を変える | `gas/Code.gs` の `SLOTS` とサイトの Details の両方 | Claudeに頼む → Apps Scriptに貼り直して「新しいバージョン」でデプロイ |
| 値上げ（10,000円） | サイト（facts・Details・フォームの `PRICE`）、Stripeのリンク、OTA | Claudeに頼む |
| 写真の差し替え（テスト回の後） | `site/img/` に追加 | 写真をClaudeに渡す |

## 月1回の確認（5分）
- サイトを開き、フォームの日付が読み込まれるか（出ない＝Apps Scriptの不調。メールでの予約案内に切り替わる）。
- 3ヶ月ごとに `fillCalendar` を実行して先の日程を足す（`gas/README.md`）。

## ドメインと未決事項
- **独自ドメイン `tokyozazen.com`（2026-10-10 取得、XServerドメイン）**：自動更新オン。DNSはXServer側で `@` → Aレコード `75.2.60.5`、`www` → CNAME `tokyo-zazen-studio.netlify.app`。Netlifyの Domain management に登録済みにすること。
- Netlify Forms は今は使っていない（予約はGAS）。`site/thanks.html` は旧フォームの名残で、どこからもリンクされていない。消してよい。
