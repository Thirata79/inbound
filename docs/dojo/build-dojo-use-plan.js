const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, HeadingLevel, LevelFormat, PageBreak, AlignmentType } = require('docx');

const FONT = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: 'Yu Gothic', cs: 'Arial' };
const W = 9026; // A4 text width with 1" margins
const p = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: [].concat(text).map(t => typeof t === 'string' ? new TextRun(t) : t) });
const b = (t) => new TextRun({ text: t, bold: true });
const hl = (t) => new TextRun({ text: t, bold: true, highlight: 'yellow' });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const li = (text) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 }, children: [].concat(text).map(t => typeof t === 'string' ? new TextRun(t) : t) });
const border = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
const cell = (t, w, head) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders: { top: border, bottom: border, left: border, right: border },
  shading: head ? { type: ShadingType.CLEAR, color: 'auto', fill: 'EDEAE2' } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [].concat(t).map(x => new Paragraph({ children: [head ? b(x) : new TextRun(x)] })),
});
const table = (cols, rows) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: cols,
  rows: rows.map((r, i) => new TableRow({ children: r.map((c, j) => cell(c, cols[j], i === 0)) })),
});

const en = [
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('Dojo Use Plan')] }),
  p('English zazen introduction for visitors — for the dojo manager'),
  p('Prepared by Takeshi Hirata (operator) with Rob Daoust (instructor). Draft, October 2026.', { spacing: { after: 240 } }),

  h2('1. What happens in the dojo'),
  p('Rob teaches a 75-minute introduction to zazen in English to small groups of visitors to Tokyo (1 to 6 guests). The flow is: introduction to posture and breathing → first sitting → kinhin → second sitting → questions. It is a quiet practice session, not an event. There is no food, music, performance or sales in the dojo.'),

  h2('2. When we use the dojo'),
  table([2000, 3513, 3513], [
    ['Day', 'Session start times (75 min each)', 'Dojo in use (incl. setup and tidying)'],
    ['Tuesday', '9:30, 11:30, 15:30', '9:15–10:45, 11:15–12:45, 15:15–16:45'],
    ['Thursday', '9:30, 11:30, 13:30', '9:15–10:45, 11:15–12:45, 13:15–14:45'],
  ]),
  p(''),
  li('None of these times overlap with the dojo’s regular zazenkai (weekday mornings 6:30–7:30, Friday and Saturday 19:00–20:00, Sunday 9:00–12:00).'),
  li('A session runs only when at least one guest has booked. On days with no bookings, the dojo is not used.'),
  li(['Thursdays and public holidays are the dojo’s regular days off. ', b('We will hold sessions on those days only with the dojo’s permission.'), ' Until then we open Tuesdays only.']),
  li('Dates the dojo needs (sesshin, events, cleaning) can be closed at any time with 2 weeks’ notice.'),

  h2('3. Layout: which spaces we use'),
  table([2600, 6426], [
    ['Space', 'How it is used'],
    ['Entrance', 'Guests take off their shoes and put them on the shoe rack. Bags and coats stay here, not in the zendo.'],
    ['Zendo (main hall)', 'Up to 6 guests and Rob. Guests sit on the dojo’s zafu in one row; Rob sits facing them. A chair is placed at the end of the row for anyone who cannot sit on the floor. The altar and Buddha image are not touched or moved.'],
    ['Toilet', 'Guests may use it before and after the session.'],
    ['Other rooms', 'Not used.'],
  ]),
  p(''),
  li('Nothing is installed or left in the dojo. No signs or notices are put up inside or outside the building.'),
  li('The dojo’s name and exact address are not shown on websites or booking sites. Only booked guests receive the address, the day before.'),
  li('No photos during zazen. Photos for our website are taken once, at a practice session, with the dojo’s agreement.'),

  h2('4. Rules for guests'),
  li('Arrive no earlier than 10 minutes before the start. Guests more than 10 minutes late cannot join.'),
  li('Quiet voices in and around the building, out of respect for neighbours and the dojo.'),
  li('Phones off in the zendo. No food or drink except water.'),
  li('Rob opens and locks the dojo, and checks that the zendo is tidy and the cushions are back in place after each session.'),

  h2('5. Who is responsible for what'),
  table([2600, 6426], [
    ['', 'Responsibility'],
    ['Takeshi Hirata (operator)', 'All bookings, payments, refunds and messages with guests. Guest information is managed by the operator. Liability insurance for the sessions is arranged by the operator.'],
    ['Rob Daoust (instructor)', 'Teaching the session, opening and closing the dojo.'],
    ['The dojo', 'Use of the zendo at the times above. No work is needed from dojo members.'],
  ]),

  h2('6. Contribution to the dojo'),
  p(['We would like to make a monthly contribution to the dojo of ', hl('JPY 20,000 per month'), ', paid by bank transfer by the 10th of the following month, starting from the first month with guests. We are happy to discuss the amount.']),

  h2('7. Contact'),
  p('Takeshi Hirata — info@takeshihirata.com'),
  p('Either side can stop this arrangement with one month’s notice.'),
];

const ja = [
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('道場の使用計画')] }),
  p('訪日外国人向け 英語による坐禅の入門 ― 道場のご担当者さまへ'),
  p('作成：平田 武（運営）、Rob Daoust（指導）。2026年10月 案', { spacing: { after: 240 } }),

  h2('1. 道場で行うこと'),
  p('Robが、東京を訪れる外国人の少人数（1〜6名）に、英語で75分の坐禅の入門を指導します。流れは、姿勢と呼吸の説明 → 坐禅 → 経行 → 坐禅 → 質疑です。静かな坐禅の時間であり、催し物ではありません。道場内での飲食、音楽、物販は行いません。'),

  h2('2. 道場を使う時間'),
  table([2000, 3513, 3513], [
    ['曜日', '開始時刻（各75分）', '道場を使う時間（準備・片付けを含む）'],
    ['火曜', '9:30・11:30・15:30', '9:15〜10:45、11:15〜12:45、15:15〜16:45'],
    ['木曜', '9:30・11:30・13:30', '9:15〜10:45、11:15〜12:45、13:15〜14:45'],
  ]),
  p(''),
  li('道場の通常の坐禅会（平日 6:30〜7:30、金・土 19:00〜20:00、日曜 9:00〜12:00）とは重なりません。'),
  li('予約が1名以上ある回だけ行います。予約のない日は道場を使いません。'),
  li(['木曜と祝日は道場の休参日のため、', b('道場のご了承をいただいた場合のみ'), '使わせていただきます。それまでは火曜のみ受け付けます。']),
  li('接心会や行事、清掃などで道場が必要な日は、2週間前までにお知らせいただければ、いつでも休みにします。'),

  h2('3. 使う場所（レイアウト）'),
  table([2600, 6426], [
    ['場所', '使い方'],
    ['玄関', '靴を脱ぎ、下駄箱に入れます。荷物と上着は玄関に置き、禅堂には持ち込みません。'],
    ['禅堂', '参加者は最大6名とRob。参加者は道場の坐蒲に一列に坐り、Robは向かい合って坐ります。床に坐れない方のために、列の端に椅子を1脚置きます。仏壇・仏像には触れず、動かしません。'],
    ['お手洗い', '始まる前と終わった後に使わせていただきます。'],
    ['その他の部屋', '使いません。'],
  ]),
  p(''),
  li('道場に物を置いたり、設置したりしません。建物の内外に看板や貼り紙は出しません。'),
  li('道場の名前と正確な住所は、ウェブサイトや予約サイトには載せません。住所は予約した方にだけ、前日にお伝えします。'),
  li('坐禅中の撮影はしません。ウェブサイト用の写真は、道場のご了承のうえ、練習の回に一度だけ撮影します。'),

  h2('4. 参加者へのお願い'),
  li('到着は開始の10分前から。10分を超えて遅れた方は参加できません。'),
  li('近隣と道場への配慮のため、建物の中と周りでは静かにしていただきます。'),
  li('禅堂では携帯電話の電源を切ります。水以外の飲食はしません。'),
  li('道場の鍵の開け閉めはRobが行い、毎回、禅堂の片付けと坐蒲の戻しを確認します。'),

  h2('5. 役割と責任'),
  table([2600, 6426], [
    ['', '担当'],
    ['平田 武（運営）', '予約、支払い、返金、参加者との連絡のすべて。参加者の情報は運営が管理します。賠償責任保険は運営が加入します。'],
    ['Rob Daoust（指導）', '坐禅の指導、道場の開け閉め。'],
    ['道場', '上記の時間の禅堂の使用。会員の方にお手伝いいただくことはありません。'],
  ]),

  h2('6. 道場へのお礼'),
  p(['道場へのお礼として、', hl('月20,000円'), 'を、参加者のあった月から、翌月10日までにお振込みしたいと考えています。金額はご相談に応じます。']),

  h2('7. 連絡先'),
  p('平田 武 ― info@takeshihirata.com'),
  p('どちらからでも、1ヶ月前にお知らせすれば取りやめることができます。'),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: FONT, size: 36, bold: true }, paragraph: { spacing: { after: 80 } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: FONT, size: 24, bold: true, color: '3F4A33' }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 240 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1440, right: 1440 } } }, children: [...en, ...ja] }],
});
Packer.toBuffer(doc).then(buf => fs.writeFileSync(process.argv[2], buf));
