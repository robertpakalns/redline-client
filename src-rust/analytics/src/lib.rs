use napi::{Error, Result};
use napi_derive::napi;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection};
use std::{
    collections::HashSet,
    io::ErrorKind::NotFound,
    path::PathBuf,
    sync::Mutex,
    time::{Instant, SystemTime, UNIX_EPOCH},
};
use url::Url;

#[derive(Clone)]
struct LastEntry {
    id: i64,
    host: String,
    path: String,
    instant: Instant,
}

static LAST_ENTRY: Lazy<Mutex<Option<LastEntry>>> = Lazy::new(|| Mutex::new(None));
static UNREGISTERED_DOMAIN_DURATION: Lazy<Mutex<i64>> = Lazy::new(|| Mutex::new(0));

static ALLOWED_DOMAINS: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    let mut set = HashSet::new();
    set.insert("kirka.io");
    set.insert("cloudyfrogs.com");
    set.insert("snipers.io");
    set.insert("ask101math.com");
    set.insert("fpsiogame.com");
    set.insert("cloudconverts.com");
    set
});

fn get_timestamp() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis() as i64
}

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
            duration INTEGER,
            timestamp INTEGER NOT NULL
        );",
    )
    .map_err(napi_err)?;
    Ok(conn)
}

#[napi]
pub fn set_entry(url: String) -> Result<()> {
    let conn = establish()?;

    let parsed_url = Url::parse(&url).map_err(napi_err)?;
    let host = parsed_url
        .host_str()
        .ok_or_else(|| napi_err("Invalid host"))?
        .to_string();
    let path = parsed_url.path().to_string();
    let instant_now = Instant::now();

    let mut last_entry_lock = LAST_ENTRY.lock().unwrap();
    let mut unregistered_cache_lock = UNREGISTERED_DOMAIN_DURATION.lock().unwrap();

    if let Some(ref last) = *last_entry_lock {
        let duration = instant_now.duration_since(last.instant).as_millis() as i64;

        if ALLOWED_DOMAINS.contains(host.as_str()) {
            if last.host == host && last.path == path {
                *last_entry_lock = Some(LastEntry {
                    id: last.id,
                    host: last.host.clone(),
                    path: last.path.clone(),
                    instant: instant_now,
                });
                return Ok(());
            }

            let total_duration = duration + *unregistered_cache_lock;

            conn.execute(
                "UPDATE entries SET duration = ?1 WHERE id = ?2",
                params![total_duration, last.id],
            )
            .map_err(napi_err)?;

            *unregistered_cache_lock = 0;

            conn.execute(
                "INSERT INTO entries (host, path, duration, timestamp) VALUES (?1, ?2, NULL, ?3)",
                params![host, path, get_timestamp()],
            )
            .map_err(napi_err)?;

            let id = conn.last_insert_rowid();

            *last_entry_lock = Some(LastEntry {
                id,
                host,
                path,
                instant: instant_now,
            });

            Ok(())
        } else {
            *unregistered_cache_lock += duration;

            *last_entry_lock = Some(LastEntry {
                id: last.id,
                host: last.host.clone(),
                path: last.path.clone(),
                instant: instant_now,
            });

            Ok(())
        }
    } else {
        if ALLOWED_DOMAINS.contains(host.as_str()) {
            conn.execute(
                "INSERT INTO entries (host, path, duration, timestamp) VALUES (?1, ?2, NULL, ?3)",
                params![host, path, get_timestamp()],
            )
            .map_err(napi_err)?;

            let id = conn.last_insert_rowid();

            *last_entry_lock = Some(LastEntry {
                id,
                host,
                path,
                instant: instant_now,
            });

            Ok(())
        } else {
            *unregistered_cache_lock = 0;
            Ok(())
        }
    }
}

#[napi]
pub fn set_last_entry() -> Result<()> {
    let conn = establish()?;
    let now = Instant::now();

    let mut last_entry_lock = LAST_ENTRY.lock().unwrap();
    if let Some(ref last) = *last_entry_lock {
        let duration = now.duration_since(last.instant).as_millis() as i64;

        conn.execute(
            "UPDATE entries SET duration = COALESCE(duration, 0) + ?1 WHERE id = ?2",
            params![duration, last.id],
        )
        .map_err(napi_err)?;
    }

    *last_entry_lock = None;
    Ok(())
}
