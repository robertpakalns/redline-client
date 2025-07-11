use napi::{Error, Result};
use napi_derive::napi;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection};
use std::{
    io::ErrorKind::NotFound,
    path::PathBuf,
    sync::Mutex,
    time::{SystemTime, UNIX_EPOCH},
};
use url::Url;

#[derive(Clone)]
struct LastEntry {
    id: i64,
    host: String,
    path: String,
    timestamp: i64,
}

static LAST_ENTRY: Lazy<Mutex<Option<LastEntry>>> = Lazy::new(|| Mutex::new(None));

fn get_db_path() -> std::io::Result<PathBuf> {
    let mut path = dirs::document_dir()
        .ok_or_else(|| std::io::Error::new(NotFound, "Documents folder not found"))?;
    path.push("RedlineClient");
    std::fs::create_dir_all(&path)?;
    path.push("analytics.sqlite");
    Ok(path)
}

fn napi_err<E: std::fmt::Display>(e: E) -> Error {
    Error::from_reason(e.to_string())
}

fn establish() -> Result<Connection> {
    let path = get_db_path().map_err(napi_err)?;
    let conn = Connection::open(path).map_err(napi_err)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY,
            host TEXT NOT NULL,
            path TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            duration INTEGER
        );",
    )
    .map_err(napi_err)?;
    Ok(conn)
}

#[napi]
pub fn set_entry(url: String) -> Result<()> {
    let conn = establish()?;

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    let parsed_url = Url::parse(&url).map_err(napi_err)?;
    let host = parsed_url
        .host_str()
        .ok_or_else(|| napi_err("Invalid host"))?
        .to_string();
    let path = parsed_url.path().to_string();

    let mut last_entry_lock = LAST_ENTRY.lock().unwrap();

    if let Some(ref mut last) = *last_entry_lock {
        if last.host == host && last.path == path {
            last.timestamp = now;
            return Ok(());
        }

        let duration = now - last.timestamp;
        conn.execute(
            "UPDATE entries SET duration = ?1 WHERE id = ?2",
            params![duration, last.id],
        )
        .map_err(napi_err)?;
    }

    conn.execute(
        "INSERT INTO entries (host, path, timestamp, duration) VALUES (?1, ?2, ?3, NULL)",
        params![host, path, now],
    )
    .map_err(napi_err)?;

    let id = conn.last_insert_rowid();

    *last_entry_lock = Some(LastEntry {
        id,
        host,
        path,
        timestamp: now,
    });

    Ok(())
}
