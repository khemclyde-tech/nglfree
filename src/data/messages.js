import { MESSAGE_STATUS, PULL_MODES } from "../constants.js";

const INSERT_MESSAGE_SQL = `INSERT INTO messages(id, text, ts, receivedAt, ip, meta_ua, meta_ref, meta_tz, meta_lang, meta_colo, meta_country, status, pulled)
 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '${MESSAGE_STATUS.NEW}', 0)`;

const QUERY_ALL_MESSAGES_SQL = "SELECT * FROM messages ORDER BY ts DESC LIMIT ? OFFSET ?";
const QUERY_UNREPLIED_MESSAGES_SQL = `SELECT * FROM messages WHERE status != '${MESSAGE_STATUS.REPLIED}' ORDER BY ts DESC LIMIT ? OFFSET ?`;
const COUNT_ALL_MESSAGES_SQL = "SELECT COUNT(*) as c FROM messages";
const COUNT_UNREPLIED_MESSAGES_SQL = `SELECT COUNT(*) as c FROM messages WHERE status != '${MESSAGE_STATUS.REPLIED}'`;
const DELETE_MESSAGE_SQL = "DELETE FROM messages WHERE id = ?";
const MARK_MESSAGE_PULLED_SQL = "UPDATE messages SET pulled = 1 WHERE id = ?";
const SET_MESSAGE_REPLY_SQL = `UPDATE messages SET reply = ?, status = '${MESSAGE_STATUS.REPLIED}', pulled = 1 WHERE id = ?`;

export async function insertMessage(db, message) {
  return db.prepare(INSERT_MESSAGE_SQL).bind(
    message.id,
    message.text,
    message.ts,
    message.receivedAt,
    message.ip,
    message.meta.ua,
    message.meta.ref,
    message.meta.tz,
    message.meta.lang,
    message.meta.colo,
    message.meta.country
  ).run();
}

export async function deleteMessageById(db, id) {
  return db.prepare(DELETE_MESSAGE_SQL).bind(id).run();
}

export async function markMessagesPulled(db, ids) {
  if (!ids.length) {
    return [];
  }

  const statements = ids.map((id) => db.prepare(MARK_MESSAGE_PULLED_SQL).bind(id));
  return db.batch(statements);
}

export async function setMessageReply(db, { id, reply }) {
  return db.prepare(SET_MESSAGE_REPLY_SQL).bind(reply, id).run();
}

export async function listMessages(db, { mode, limit, offset }) {
  const query = mode === PULL_MODES.ALL ? QUERY_ALL_MESSAGES_SQL : QUERY_UNREPLIED_MESSAGES_SQL;
  const result = await db.prepare(query).bind(limit, offset).all();

  return result.results || [];
}

export async function countMessages(db, mode) {
  const query = mode === PULL_MODES.ALL ? COUNT_ALL_MESSAGES_SQL : COUNT_UNREPLIED_MESSAGES_SQL;
  const row = await db.prepare(query).first();

  return row?.c || 0;
}
