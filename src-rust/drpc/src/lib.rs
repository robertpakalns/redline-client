use napi::{Error, Result};
use napi_derive::napi;
use std::{
    collections::HashMap,
    io::{Read, Write},
    process,
    sync::{Arc, LazyLock, Mutex},
    thread::{sleep, spawn},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

#[cfg(windows)]
use std::fs::{File, OpenOptions};

#[cfg(unix)]
use std::os::unix::net::UnixStream;

use url_parser::parse_url;

#[cfg(windows)]
type Pipe = File;
#[cfg(unix)]
type Pipe = UnixStream;

struct Drpc {
    start_ts: u64,
    join_btn: bool,
    state: String,
    details: String,
    join_url: String,

    #[cfg(windows)]
    pipe: File,
    #[cfg(unix)]
    pipe: UnixStream,

    pid: u32,
    version_text: String,
}

static INSTANCE: LazyLock<Mutex<Option<Arc<Mutex<Drpc>>>>> = LazyLock::new(|| Mutex::new(None));

static STATIC_LINKS: LazyLock<HashMap<&'static str, &'static str>> = LazyLock::new(|| {
    HashMap::from([
        ("/", "Viewing main lobby"),
        ("/auth", "Viewing authentication page"),
        ("/levels", "Viewing level tracker"),
        ("/hub/leaderboard", "Viewing player leaderboard"),
        ("/hub/clans/champions-league", "Viewing clan leaderboard"),
        (
            "/hub/ranked/leaderboard-point3v3",
            "Viewing ranked leaderboard: Point 3v3",
        ),
        (
            "/hub/ranked/leaderboard-sad",
            "Viewing ranked leaderboard: Search And Destroy",
        ),
        (
            "/hub/ranked/leaderboard-1v1",
            "Viewing ranked leaderboard: 1v1",
        ),
        ("/hub/clans/my-clan", "Viewing their clan"),
        ("/hub/market", "Viewing market"),
        ("/hub/live", "Viewing videos"),
        ("/hub/news", "Viewing news"),
        ("/hub/terms", "Viewing terms of service"),
        ("/store", "Viewing store"),
        ("/servers/main", "Viewing servers"),
        ("/servers/parkour", "Viewing parkour servers"),
        ("/servers/custom", "Viewing custom servers"),
        ("/quests/hourly", "Viewing hourly quests"),
        ("/friends", "Viewing their friends"),
        ("/inventory", "Viewing their inventory"),
    ])
});

fn get_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

fn napi_err<E: std::fmt::Display>(e: E) -> Error {
    Error::from_reason(e.to_string())
}

fn send_packet(pipe: &mut Pipe, opcode: u32, json: &str) -> std::io::Result<()> {
    let mut p = Vec::new();
    p.extend_from_slice(&opcode.to_le_bytes());
    p.extend_from_slice(&(json.len() as u32).to_le_bytes());
    p.extend_from_slice(json.as_bytes());
    pipe.write_all(&p)
}

fn connect_to_discord(client_id: &str) -> std::io::Result<Pipe> {
    #[cfg(windows)]
    {
        for i in 0..=10 {
            let pipe_path = format!(r"\\?\pipe\discord-ipc-{}", i);
            if let Ok(mut pipe) = OpenOptions::new().read(true).write(true).open(&pipe_path) {
                let handshake = format!(r#"{{ "v": 1, "client_id": "{client_id}" }}"#);
                send_packet(&mut pipe, 0, &handshake)?;
                let mut buf = [0u8; 1024];
                let _ = pipe.read(&mut buf);
                return Ok(pipe);
            }
        }
    }

    #[cfg(unix)]
    {
        for i in 0..=10 {
            let pipe_path = format!("/tmp/discord-ipc-{}", i);
            if let Ok(mut pipe) = UnixStream::connect(&pipe_path) {
                let handshake = format!(r#"{{ "v": 1, "client_id": "{client_id}" }}"#);
                send_packet(&mut pipe, 0, &handshake)?;
                let mut buf = [0u8; 1024];
                let _ = pipe.read(&mut buf);
                return Ok(pipe);
            }
        }
    }

    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "Discord IPC not found",
    ))
}

#[napi]
pub fn init(join_btn: bool, initial_url: String, version: String) {
    let client_id = "1385893715519864933";

    let mut instance = INSTANCE.lock().unwrap();
    if instance.is_some() {
        return;
    }

    let pipe = connect_to_discord(client_id).unwrap();

    let drpc = Arc::new(Mutex::new(Drpc {
        pipe,
        start_ts: get_timestamp(),
        join_btn,
        state: "Playing Kirka.io".to_string(),
        details: String::new(),
        join_url: "redline://".to_string(),
        pid: process::id(),
        version_text: format!("Redline Client v{}", version),
    }));

    {
        let mut drpc_lock = drpc.lock().unwrap();
        set_status_internal(&mut drpc_lock, &initial_url).unwrap();
        update_activity(&mut drpc_lock);
    }

    let drpc_thread = drpc.clone();
    spawn(move || {
        loop {
            sleep(Duration::from_secs(15));
            update_activity(&mut drpc_thread.lock().unwrap());
        }
    });

    *instance = Some(drpc);
}

fn set_status_internal(drpc: &mut Drpc, url: &str) -> Result<()> {
    let (host, _, path, _, _) = parse_url(&url).map_err(napi_err).unwrap();

    drpc.state = if path.starts_with("/games") {
        let server = path
            .split("/")
            .nth(2)
            .unwrap_or_default()
            .split("~")
            .next()
            .unwrap_or_default();
        format!("Playing a match on the {} server", server)
    } else if path.starts_with("/profile") {
        let profile_id = path.split("/").nth(2).unwrap_or_default();
        format!("Viewing player profile with ID {}", profile_id)
    } else if path.starts_with("/___lobby___") {
        let lobby = path
            .split("/")
            .nth(2)
            .unwrap_or_default()
            .split("~")
            .next()
            .unwrap_or_default();
        format!("In the {} lobby", lobby)
    } else {
        STATIC_LINKS
            .get(path.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| "Playing Kirka.io".to_string())
    };

    drpc.details = host.to_string();
    drpc.join_url = if path == "/" {
        "redline://".to_string()
    } else {
        format!("redline://?url={}", path)
    };

    Ok(())
}

#[napi]
pub fn set_status(url: String) -> Result<()> {
    let instance = INSTANCE.lock().unwrap();
    let mut drpc = instance
        .as_ref()
        .ok_or_else(|| napi_err("DRPC not initialized."))?
        .lock()
        .unwrap();

    set_status_internal(&mut drpc, &url)?;
    Ok(())
}

fn update_activity(drpc: &mut Drpc) {
    let mut buttons = vec![(
        "Download Client".to_string(),
        "https://tricko.pro/redline".to_string(),
    )];

    if drpc.join_btn {
        buttons.insert(0, ("Join Game".to_string(), drpc.join_url.clone()));
    } else {
        buttons.push((
            "Community Server".to_string(),
            "https://discord.gg/cTE6CVuGen".to_string(),
        ));
    }

    let mut buttons_json = String::new();
    for (i, (label, url)) in buttons.iter().enumerate() {
        if i > 0 {
            buttons_json.push(',');
        }
        buttons_json.push_str(&format!(r#"{{"label":"{label}","url":"{url}"}}"#));
    }

    let json = format!(
        r#"{{
            "cmd": "SET_ACTIVITY",
            "args": {{
                "pid": {},
                "activity": {{
                    "state": "{}",
                    "details": "{}",
                    "timestamps": {{ "start": {} }},
                    "assets": {{
                        "large_image": "redline",
                        "large_text": "{}"
                    }},
                    "buttons": [{}]
                }}
            }},
            "nonce": "{}"
        }}"#,
        drpc.pid,
        drpc.state,
        drpc.details,
        drpc.start_ts,
        drpc.version_text,
        buttons_json,
        get_timestamp(),
    );

    send_packet(&mut drpc.pipe, 1, &json).unwrap();
}
