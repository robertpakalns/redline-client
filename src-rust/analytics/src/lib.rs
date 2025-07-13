use chrono::{DateTime, Local, Utc};
use napi::{Error, Result};
use napi_derive::napi;
use once_cell::sync::Lazy;
use rusqlite::{params, Connection};
use std::{
    collections::{HashMap, HashSet},
    io::ErrorKind::NotFound,
    path::PathBuf,
    sync::{mpsc, Arc, Mutex},
    thread::spawn,
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

static LAST_ENTRY: Lazy<Arc<Mutex<Option<LastEntry>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));
static UNREGISTERED_DOMAIN_DURATION: Lazy<Arc<Mutex<i64>>> = Lazy::new(|| Arc::new(Mutex::new(0)));

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

fn napi_err<E: std::fmt::Display>(e: E) -> Error {
    Error::from_reason(e.to_string())
}

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

fn establish_connection() -> Result<Connection> {
    let path = get_db_path().map_err(napi_err)?;
    let conn = Connection::open(path).map_err(napi_err)?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY,
            host TEXT NOT NULL,
            path TEXT NOT NULL,
            duration INTEGER DEFAULT 0,
            timestamp INTEGER NOT NULL
        );",
    )
    .map_err(napi_err)?;
    Ok(conn)
}

#[napi]
pub fn set_entry(url: String) -> Result<()> {
    let url = url.clone();
    let last_entry = LAST_ENTRY.clone();
    let unregistered_duration = UNREGISTERED_DOMAIN_DURATION.clone();

    spawn(move || {
        if let Err(e) = (|| -> Result<()> {
            let conn = establish_connection()?;
            let parsed_url = Url::parse(&url).map_err(napi_err)?;
            let host = parsed_url
                .host_str()
                .ok_or_else(|| napi_err("Invalid host"))?
                .to_string();
            let path = parsed_url.path().to_string();
            let instant_now = Instant::now();

            let mut last_entry_lock = last_entry.lock().unwrap();
            let mut unregistered_lock = unregistered_duration.lock().unwrap();

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

                    let total_duration = duration + *unregistered_lock;

                    conn.execute(
                        "UPDATE entries SET duration = ?1 WHERE id = ?2",
                        params![total_duration, last.id],
                    )
                    .map_err(napi_err)?;

                    *unregistered_lock = 0;

                    conn.execute(
                        "INSERT INTO entries (host, path, duration, timestamp) VALUES (?1, ?2, 0, ?3)",
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
                } else {
                    *unregistered_lock += duration;
                    *last_entry_lock = Some(LastEntry {
                        id: last.id,
                        host: last.host.clone(),
                        path: last.path.clone(),
                        instant: instant_now,
                    });
                }
            } else if ALLOWED_DOMAINS.contains(host.as_str()) {
                conn.execute(
                    "INSERT INTO entries (host, path, duration, timestamp) VALUES (?1, ?2, 0, ?3)",
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
            } else {
                *unregistered_lock = 0;
            }

            Ok(())
        })() {
            eprintln!("Error in set_entry thread: {}", e);
        }
    });

    Ok(())
}

#[napi]
pub fn set_last_entry() -> Result<()> {
    let last_entry = LAST_ENTRY.clone();

    spawn(move || {
        if let Err(e) = (|| -> Result<()> {
            let conn = establish_connection()?;
            let now = Instant::now();

            let mut last_entry_lock = last_entry.lock().unwrap();
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
        })() {
            eprintln!("Error in set_last_entry thread: {}", e);
        }
    });

    Ok(())
}

#[napi(object)]
pub struct Entry {
    pub host: String,
    pub path: String,
    pub duration: i64,
    pub timestamp: i64,
}

#[napi(object)]
pub struct DailyAnalytics {
    pub date: String,
    pub total_time_spent: i64,
    pub game_time_spent: i64,
}

#[napi(object)]
pub struct AnalyticsReport {
    pub entries: Vec<Entry>,
    pub total_time_spent: i64,
    pub total_game_time_spent: i64,
    pub time_spent_per_host: HashMap<String, i64>,
    pub week_data: Vec<DailyAnalytics>,
}

#[napi]
pub fn get_all_data() -> Result<AnalyticsReport> {
    let (tx, rx) = mpsc::channel();

    spawn(move || {
        let report = prepare_data();
        let _ = tx.send(report);
    });

    rx.recv().unwrap()
}

fn prepare_data() -> Result<AnalyticsReport> {
    let conn = establish_connection()?;

    let mut stmt = conn
        .prepare("SELECT host, path, duration, timestamp FROM entries")
        .map_err(napi_err)?;

    let entry_iter = stmt
        .query_map([], |row| {
            Ok(Entry {
                host: row.get(0)?,
                path: row.get(1)?,
                duration: row.get(2)?,
                timestamp: row.get(3)?,
            })
        })
        .map_err(napi_err)?;

    let mut entries = Vec::new();
    let mut total_time_spent = 0;
    let mut total_game_time_spent = 0;
    let mut time_spent_per_host: HashMap<String, i64> = HashMap::new();
    let mut daily_map: HashMap<String, (i64, i64)> = HashMap::new();

    for entry_result in entry_iter {
        let entry = entry_result.map_err(napi_err)?;
        total_time_spent += entry.duration;
        if entry.path.starts_with("/games/") {
            total_game_time_spent += entry.duration;
        }
        *time_spent_per_host.entry(entry.host.clone()).or_insert(0) += entry.duration;

        let dt_utc = DateTime::<Utc>::from_timestamp_millis(entry.timestamp)
            .unwrap_or_else(|| DateTime::<Utc>::from_timestamp_millis(0).unwrap());
        let local_date = dt_utc.with_timezone(&Local).date_naive().to_string();

        let (total, game) = daily_map.entry(local_date).or_insert((0, 0));
        *total += entry.duration;
        if entry.path.starts_with("/games/") {
            *game += entry.duration;
        }

        entries.push(entry);
    }

    let mut week_data: Vec<DailyAnalytics> = daily_map
        .into_iter()
        .map(|(date, (total, game))| DailyAnalytics {
            date,
            total_time_spent: total,
            game_time_spent: game,
        })
        .collect();

    week_data.sort_by(|a, b| b.date.cmp(&a.date));
    week_data.truncate(7);

    Ok(AnalyticsReport {
        entries,
        total_time_spent,
        total_game_time_spent,
        time_spent_per_host,
        week_data,
    })
}
