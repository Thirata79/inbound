/**
 * Tokyo Zazen Studio — booking requests (Google Apps Script)
 * Spec: docs/booking-requirements.md
 *
 * Personal values (emails, payment link, directions) live in
 * Project Settings → Script Properties, not in this file:
 *   ADMIN_EMAIL       T's address for new-request notices (default: script owner)
 *   REPLY_TO          address guests reply to (default: sender)
 *   ROBERT_EMAIL      where the day-before headcount goes
 *   PAYMENT_LINK      Stripe Payment Link URL (¥9,000 × quantity)
 *   VENUE_DIRECTIONS  address and directions for the reminder (plain text, multi-line)
 *   REVIEW_URL        where guests leave a review (optional)
 */

const CONFIG = {
  SHARED_KEY: 'tzs-2026', // also in site/index.html; not a secret, only filters noise
  BRAND: 'Tokyo Zazen Studio',
  TZ: 'Asia/Tokyo',
  PRICE_JPY: 9000,
  MAX_PARTY: 6,
  CUTOFF_DAYS: 2, // requests must be at least this many days ahead
  HORIZON_DAYS: 90,
  SLOTS: { 2: '9:30,11:30,13:30,15:30', 4: '9:30,12:30,15:30' }, // weekday (0=Sun) → slots
  OPEN_DAYS_DEFAULT: { 2: true, 4: false }, // Thursday stays closed until the venue confirms
  HOLIDAY_CAL: 'ja.japanese#holiday@group.v.calendar.google.com',
  ROBERT_RATES: [[100, 3500], [150, 3750], [Infinity, 4000]], // monthly persons, marginal rate
};

const STATUS = {
  NEW: '新規', CONFIRMED: '確定', PAID: '支払済', DECLINED: '不可',
  CANCELLED: 'キャンセル', LATE_CANCEL: '直前キャンセル', ATTENDED: '参加済', NO_SHOW: 'No-show',
};

const RES_HEADERS = [
  'id', 'submitted_at', 'status', 'session_date', 'session_time', 'party_size',
  'name', 'email', 'country', 'contact_type', 'contact_id', 'hotel', 'floor_ok',
  'notes_guest', 'source', 'amount_jpy', 'mail_confirmed_at', 'mail_reminded_at',
  'mail_thanked_at', 'notes_staff',
];
const CAL_HEADERS = ['date', 'accepting', 'time_slots', 'memo'];
const SET_HEADERS = ['month', 'session_date', 'session_time', 'persons', 'memo'];

// ---------- setup (run once from the editor) ----------

function setupSheets() {
  const ss = SpreadsheetApp.getActive();
  const res = getOrCreate_(ss, 'reservations', RES_HEADERS);
  res.getRange('A:F').setNumberFormat('@');
  res.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(Object.values(STATUS), true).build());
  const cal = getOrCreate_(ss, 'calendar', CAL_HEADERS);
  cal.getRange('A:A').setNumberFormat('@');
  cal.getRange('C:C').setNumberFormat('@');
  getOrCreate_(ss, 'settlement', SET_HEADERS).getRange('A:C').setNumberFormat('@');
}

function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendStatusMails').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('sendReminders').timeBased().atHour(10).everyDays(1).inTimezone(CONFIG.TZ).create();
  ScriptApp.newTrigger('sendThanks').timeBased().atHour(12).everyDays(1).inTimezone(CONFIG.TZ).create();
  ScriptApp.newTrigger('notifyRobert').timeBased().atHour(18).everyDays(1).inTimezone(CONFIG.TZ).create();
  ScriptApp.newTrigger('monthlySettlement').timeBased().onMonthDay(1).atHour(3).inTimezone(CONFIG.TZ).create();
}

/** Adds Tuesday/Thursday rows for the coming months. Existing dates are left alone. */
function fillCalendar(months) {
  months = months || 3;
  const sh = sheet_('calendar');
  const have = new Set(sh.getDataRange().getValues().slice(1).map(r => dateStr_(r[0])));
  const holidays = holidaySet_(months);
  const rows = [];
  const d = today_();
  const end = new Date(d); end.setMonth(end.getMonth() + months);
  for (; d <= end; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    if (!CONFIG.SLOTS[wd]) continue;
    const ds = fmt_(d, 'yyyy-MM-dd');
    if (have.has(ds)) continue;
    let open = CONFIG.OPEN_DAYS_DEFAULT[wd];
    let memo = wd === 4 && !open ? '木曜：法人の確認待ち' : '';
    if (holidays === null) memo = (memo ? memo + '／' : '') + '祝日未確認';
    else if (holidays.has(ds)) { open = false; memo = '祝日'; }
    rows.push([ds, open, CONFIG.SLOTS[wd], memo]);
  }
  if (rows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    sh.getRange(2, 2, sh.getLastRow() - 1, 1).insertCheckboxes();
    sh.getRange(2, 1, sh.getLastRow() - 1, 4).sort(1);
  }
  return rows.length;
}

// ---------- web app ----------

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.key !== CONFIG.SHARED_KEY) return json_({ ok: false, error: 'BAD_KEY' });
  if (p.action !== 'calendar') return json_({ ok: false, error: 'BAD_ACTION' });
  const cache = CacheService.getScriptCache();
  const hit = cache.get('calendar');
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);
  const body = JSON.stringify({ ok: true, days: openDays_() });
  cache.put('calendar', body, 600);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'BAD_REQUEST' }); }
  if (b.website) return json_({ ok: true, id: 'Z-00000000-000' }); // honeypot
  if (b.key !== CONFIG.SHARED_KEY) return json_({ ok: false, error: 'BAD_KEY' });
  if (b.action !== 'reserve') return json_({ ok: false, error: 'BAD_ACTION' });

  const f = {};
  ['session_date', 'session_time', 'name', 'email', 'country', 'contact_type', 'contact_id',
    'hotel', 'floor_ok', 'notes_guest', 'source'].forEach(k => { f[k] = clean_(b[k]); });
  f.party_size = Number(b.party_size);

  const day = openDays_().find(x => x.date === f.session_date);
  if (!day) return json_({ ok: false, error: 'INVALID_DATE' });
  if (day.slots.indexOf(f.session_time) < 0) return json_({ ok: false, error: 'INVALID_TIME' });
  if (!(f.party_size >= 1 && f.party_size <= CONFIG.MAX_PARTY && Number.isInteger(f.party_size))) {
    return json_({ ok: false, error: 'INVALID_PARTY_SIZE' });
  }
  const contactTypes = ['whatsapp', 'line', 'sms', 'email_only'];
  const floor = ['yes', 'no', 'unsure'];
  if (!f.name || !f.email || !f.country || contactTypes.indexOf(f.contact_type) < 0 ||
      floor.indexOf(f.floor_ok) < 0 || (f.contact_type !== 'email_only' && !f.contact_id) ||
      b.ack_request !== true || b.ack_payment !== true) {
    return json_({ ok: false, error: 'MISSING_FIELDS' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return json_({ ok: false, error: 'INVALID_EMAIL' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: 'BUSY' });
  let id;
  try {
    const sh = sheet_('reservations');
    const prefix = 'Z-' + f.session_date.replace(/-/g, '') + '-';
    const n = sh.getRange(1, 1, sh.getLastRow(), 1).getValues()
      .filter(r => String(r[0]).indexOf(prefix) === 0).length + 1;
    id = prefix + ('00' + n).slice(-3);
    const amount = CONFIG.PRICE_JPY * f.party_size;
    const row = {
      id: id, submitted_at: fmt_(new Date(), 'yyyy-MM-dd HH:mm'), status: STATUS.NEW,
      session_date: f.session_date, session_time: f.session_time, party_size: String(f.party_size),
      name: f.name, email: f.email, country: f.country, contact_type: f.contact_type,
      contact_id: f.contact_id, hotel: f.hotel, floor_ok: f.floor_ok, notes_guest: f.notes_guest,
      source: f.source || 'direct', amount_jpy: amount,
    };
    sh.appendRow(RES_HEADERS.map(h => row[h] === undefined ? '' : row[h]));
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  const r = Object.assign({ id: id, amount_jpy: CONFIG.PRICE_JPY * f.party_size }, f);
  try { mailAdminNew_(r); } catch (err) { console.error(err); }
  try { mailGuestReceived_(r); } catch (err) { console.error(err); }
  return json_({ ok: true, id: id });
}

// ---------- scheduled jobs ----------

function sendStatusMails() {
  const link = prop_('PAYMENT_LINK');
  let missingLink = false;
  eachRow_((r, set) => {
    if (!isDirect_(r) || r.mail_confirmed_at) return;
    if (r.status === STATUS.DECLINED) {
      mailGuestDeclined_(r);
      set('mail_confirmed_at', now_());
    } else if (r.status === STATUS.CONFIRMED) {
      if (!link) { missingLink = true; return; }
      mailGuestConfirmed_(r, link);
      set('mail_confirmed_at', now_());
    }
  });
  if (missingLink) throw new Error('PAYMENT_LINK is not set in Script Properties; confirmation emails were not sent.');
}

function sendReminders() {
  const directions = prop_('VENUE_DIRECTIONS');
  const tomorrow = dayOffset_(1);
  let pending = false;
  eachRow_((r, set) => {
    if (!isDirect_(r) || r.status !== STATUS.PAID || r.session_date !== tomorrow || r.mail_reminded_at) return;
    if (!directions) { pending = true; return; }
    mailGuestReminder_(r, directions);
    set('mail_reminded_at', now_());
  });
  if (pending) throw new Error('VENUE_DIRECTIONS is not set in Script Properties; reminders were not sent.');
}

function sendThanks() {
  const yesterday = dayOffset_(-1);
  eachRow_((r, set) => {
    if (!isDirect_(r) || r.status !== STATUS.ATTENDED || r.session_date !== yesterday || r.mail_thanked_at) return;
    mailGuestThanks_(r);
    set('mail_thanked_at', now_());
  });
}

/** Day-before headcount for Robert. No names or contact details (customer data stays with T). */
function notifyRobert() {
  const to = prop_('ROBERT_EMAIL');
  if (!to) return;
  const tomorrow = dayOffset_(1);
  const day = sheet_('calendar').getDataRange().getValues().slice(1)
    .find(r => dateStr_(r[0]) === tomorrow && r[1] === true);
  if (!day) return; // no session day tomorrow
  const bySlot = {};
  eachRow_(r => {
    if (r.session_date !== tomorrow) return;
    const counts = isDirect_(r) ? r.status === STATUS.PAID
      : [STATUS.CANCELLED, STATUS.DECLINED, STATUS.LATE_CANCEL].indexOf(r.status) < 0;
    if (!counts) return;
    const s = bySlot[r.session_time] || (bySlot[r.session_time] = { people: 0, floor: 0 });
    s.people += Number(r.party_size) || 0;
    if (r.floor_ok === 'no' || r.floor_ok === 'unsure') s.floor += Number(r.party_size) || 0;
  });
  const lines = String(day[2]).split(',').map(t => t.trim()).map(t => {
    const s = bySlot[t];
    if (!s) return t + '  —  no bookings';
    return t + '  —  ' + s.people + (s.people === 1 ? ' person' : ' people') +
      (s.floor ? ' (' + s.floor + ' may need a chair or bench)' : '');
  });
  send_(to, 'Tomorrow at the dojo — ' + longDate_(tomorrow),
    'Hello Rob,\n\nHere are the bookings for tomorrow, ' + longDate_(tomorrow) + ':\n\n' +
    lines.join('\n') + '\n\nThank you,\nTakeshi');
}

/** Persons per slot for last month: attended + no-show + late cancellations (agreement 2026-10-09). */
function monthlySettlement() {
  const d = today_(); d.setDate(1); d.setMonth(d.getMonth() - 1);
  const month = fmt_(d, 'yyyy-MM');
  const billable = [STATUS.ATTENDED, STATUS.NO_SHOW, STATUS.LATE_CANCEL];
  const bySlot = {};
  eachRow_(r => {
    if (r.session_date.slice(0, 7) !== month || billable.indexOf(r.status) < 0) return;
    const k = r.session_date + ' ' + r.session_time;
    bySlot[k] = (bySlot[k] || 0) + (Number(r.party_size) || 0);
  });
  const sh = sheet_('settlement');
  const keep = sh.getDataRange().getValues().slice(1).filter(r => String(r[0]) !== month);
  const rows = Object.keys(bySlot).sort().map(k => [month, k.split(' ')[0], k.split(' ')[1], bySlot[k], '']);
  const total = rows.reduce((a, r) => a + r[3], 0);
  rows.push([month, '', '合計', total, 'Robertへの支払い ' + robertPay_(total).toLocaleString('ja-JP') + '円']);
  sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), SET_HEADERS.length).clearContent();
  const all = keep.concat(rows);
  if (all.length) sh.getRange(2, 1, all.length, SET_HEADERS.length).setValues(all);
}

function robertPay_(persons) {
  let pay = 0, prev = 0;
  for (const [upTo, rate] of CONFIG.ROBERT_RATES) {
    const n = Math.max(0, Math.min(persons, upTo) - prev);
    pay += n * rate;
    prev = upTo;
    if (persons <= upTo) break;
  }
  return pay;
}

// ---------- emails ----------

function mailAdminNew_(r) {
  const to = prop_('ADMIN_EMAIL') || Session.getEffectiveUser().getEmail();
  const floor = { yes: '座れる', no: '座れない', unsure: 'わからない' }[r.floor_ok];
  send_(to, '【予約】' + r.session_date + ' ' + r.session_time + ' ' + r.party_size + '名 ' + r.name,
    [
      '新しい予約リクエストです。',
      '',
      '受付番号: ' + r.id,
      '日時: ' + r.session_date + ' ' + r.session_time,
      '人数: ' + r.party_size + '名（' + yen_(r.amount_jpy) + '）',
      '名前: ' + r.name,
      'メール: ' + r.email,
      '国: ' + r.country,
      '連絡手段: ' + r.contact_type + (r.contact_id ? ' ' + r.contact_id : ''),
      '滞在先: ' + (r.hotel || '—'),
      '床に座れるか: ' + floor,
      'メモ: ' + (r.notes_guest || '—'),
      '流入: ' + (r.source || 'direct'),
      '',
      '→ OTAの予約状況を確認して、シートの status を「確定」か「不可」に変えてください。',
      '  1時間以内にお客さんへメールが自動で送られます。',
      '',
      SpreadsheetApp.getActive().getUrl(),
    ].join('\n'), { noReplyTo: true });
}

function mailGuestReceived_(r) {
  send_(r.email, 'We received your request — ' + CONFIG.BRAND, [
    'Dear ' + r.name + ',',
    '',
    'Thank you for your request. This is not yet a confirmed booking.',
    'We will reply within 24 hours.',
    '',
    summary_(r),
    '',
    'Once we confirm your time, we will send you a secure payment link.',
    'Your place is booked when payment is complete.',
    '',
    'If you do not hear from us within 24 hours, simply reply to this email.',
    '',
    CONFIG.BRAND,
  ].join('\n'));
}

function mailGuestConfirmed_(r, link) {
  const url = link + (link.indexOf('?') < 0 ? '?' : '&') +
    'client_reference_id=' + encodeURIComponent(r.id) + '&prefilled_email=' + encodeURIComponent(r.email);
  const hoursLeft = (sessionStart_(r) - new Date()) / 36e5;
  const window = hoursLeft < 72 ? 24 : 48;
  send_(r.email, 'Your session is reserved — please complete payment', [
    'Dear ' + r.name + ',',
    '',
    'Good news: we have reserved your place. Your booking is complete once payment is made.',
    '',
    summary_(r),
    '',
    'Pay securely here (card):',
    url,
    '',
    'Please pay within ' + window + ' hours. If we do not receive payment by then, the place may be released.',
    'Please enter ' + r.party_size + ' as the quantity on the payment page.',
    '',
    'Location: Koto City, Tokyo, near Kiyosumi-shirakawa and Monzen-nakacho stations.',
    'We will email the exact address and directions the day before your session.',
    '',
    'Cancellation: free up to 24 hours before the session. After that, and for no-shows, the payment is not refunded.',
    '',
    'Please reply to this email if anything changes.',
    '',
    CONFIG.BRAND,
  ].join('\n'));
}

function mailGuestDeclined_(r) {
  send_(r.email, 'About your request — ' + CONFIG.BRAND, [
    'Dear ' + r.name + ',',
    '',
    'Thank you for your request. Unfortunately, the session on ' + longDate_(r.session_date) +
      ' at ' + r.session_time + ' is full.',
    '',
    'If another time during your stay would work, just reply to this email and we will do our best to find you a place.',
    '',
    CONFIG.BRAND,
  ].join('\n'));
}

function mailGuestReminder_(r, directions) {
  send_(r.email, 'See you tomorrow — ' + CONFIG.BRAND, [
    'Dear ' + r.name + ',',
    '',
    'We look forward to sitting with you tomorrow.',
    '',
    summary_(r),
    '',
    'How to get there:',
    directions,
    '',
    'What to wear: loose, comfortable clothing you can sit cross-legged in. Shoes are removed inside.',
    '',
    'If anything changes, please reply to this email.',
    '',
    CONFIG.BRAND,
  ].join('\n'));
}

function mailGuestThanks_(r) {
  const review = prop_('REVIEW_URL');
  send_(r.email, 'Thank you for sitting with us — ' + CONFIG.BRAND, [
    'Dear ' + r.name + ',',
    '',
    'Thank you for joining us yesterday. We hope the quiet stays with you for the rest of your trip.',
    '',
    'A few minutes of sitting each morning is a good way to keep the practice going at home.',
  ].concat(review ? [
    '',
    'If you enjoyed the session, a short review would help other travellers find us:',
    review,
  ] : []).concat(['', CONFIG.BRAND]).join('\n'));
}

function summary_(r) {
  return [
    'Request no.  ' + r.id,
    'Date         ' + longDate_(r.session_date) + ', ' + r.session_time,
    'People       ' + r.party_size,
    'Total        ' + yen_(r.amount_jpy || CONFIG.PRICE_JPY * Number(r.party_size)),
  ].join('\n');
}

function send_(to, subject, body, opts) {
  const o = { name: CONFIG.BRAND };
  const replyTo = prop_('REPLY_TO');
  if (replyTo && !(opts && opts.noReplyTo)) o.replyTo = replyTo;
  MailApp.sendEmail(to, subject, body, o);
}

// ---------- helpers ----------

function openDays_() {
  const from = dayOffset_(CONFIG.CUTOFF_DAYS);
  const to = dayOffset_(CONFIG.HORIZON_DAYS);
  return sheet_('calendar').getDataRange().getValues().slice(1)
    .map(r => ({ date: dateStr_(r[0]), open: r[1] === true, slots: String(r[2]).split(',').map(s => s.trim()).filter(Boolean) }))
    .filter(d => d.open && d.slots.length && d.date >= from && d.date <= to)
    .sort((a, b) => a.date < b.date ? -1 : 1)
    .map(d => ({ date: d.date, slots: d.slots }));
}

/** Calls fn(rowObject, set) for each reservation; set(key, value) writes back to the sheet. */
function eachRow_(fn) {
  const sh = sheet_('reservations');
  const values = sh.getDataRange().getValues();
  const head = values[0];
  values.slice(1).forEach((v, i) => {
    const r = {};
    head.forEach((h, j) => { r[h] = v[j] instanceof Date ? (h === 'session_date' ? dateStr_(v[j]) : fmt_(v[j], 'yyyy-MM-dd HH:mm')) : String(v[j]); });
    fn(r, (k, val) => sh.getRange(i + 2, head.indexOf(k) + 1).setValue(val));
  });
}

function isDirect_(r) { return r.id.indexOf('Z-') === 0 && r.email; }

function sessionStart_(r) {
  const [y, m, d] = r.session_date.split('-').map(Number);
  const [hh, mm] = r.session_time.split(':').map(Number);
  // JST is UTC+9 with no daylight saving
  return new Date(Date.UTC(y, m - 1, d, hh - 9, mm));
}

function holidaySet_(months) {
  const cal = CalendarApp.getCalendarById(CONFIG.HOLIDAY_CAL);
  if (!cal) return null;
  const start = today_();
  const end = new Date(start); end.setMonth(end.getMonth() + months + 1);
  return new Set(cal.getEvents(start, end).map(e => fmt_(e.getAllDayStartDate(), 'yyyy-MM-dd')));
}

/** Plain text, trimmed, length-capped, and never interpreted as a spreadsheet formula. */
function clean_(v) {
  let s = String(v === undefined || v === null ? '' : v).trim().slice(0, 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function getOrCreate_(ss, name, headers) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  sh.setFrozenRows(1);
  return sh;
}

function sheet_(name) { return SpreadsheetApp.getActive().getSheetByName(name); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fmt_(d, p) { return Utilities.formatDate(d, CONFIG.TZ, p); }
function now_() { return fmt_(new Date(), 'yyyy-MM-dd HH:mm'); }
function dateStr_(v) { return v instanceof Date ? fmt_(v, 'yyyy-MM-dd') : String(v).trim(); }
function yen_(n) { return '¥' + Number(n).toLocaleString('en-US'); }

function today_() {
  const [y, m, d] = fmt_(new Date(), 'yyyy-MM-dd').split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dayOffset_(n) {
  const [y, m, d] = fmt_(new Date(), 'yyyy-MM-dd').split('-').map(Number);
  return fmt_(new Date(Date.UTC(y, m - 1, d + n, 3)), 'yyyy-MM-dd'); // 3:00 UTC = 12:00 JST, safely inside the day
}

function longDate_(ds) {
  const [y, m, d] = ds.split('-').map(Number);
  return fmt_(new Date(Date.UTC(y, m - 1, d, 3)), 'EEEE d MMMM yyyy');
}
