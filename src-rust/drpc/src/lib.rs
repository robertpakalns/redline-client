use discord_rich_presence::{
    DiscordIpc, DiscordIpcClient,
    activity::{Activity, Assets, Button, Timestamps},
};
use napi::{Error, Result};
use napi_derive::napi;
use std::{
    collections::HashMap,
    sync::{Arc, LazyLock, Mutex},
    thread::{sleep, spawn},
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use url_parse::core::Parser;

struct Drpc {
    client: DiscordIpcClient,
    start_ts: i64,
    join_btn: bool,
    protocol: String,
    state: String,
    details: String,
    join_url: String,
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

fn napi_err<E: std::fmt::Display>(e: E) -> Error {
    Error::from_reason(e.to_string())
}

#[napi]
pub fn init(join_btn: bool, initial_url: String) {
    let client_id = "1385893715519864933";

    let mut instance = INSTANCE.lock().unwrap();
    if instance.is_some() {
        return;
    }

    let drpc = Arc::new(Mutex::new(Drpc {
        client: DiscordIpcClient::new(&client_id).map_err(napi_err).unwrap(),
        start_ts: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64,
        join_btn,
        protocol: "redline://".to_string(),
        state: "Playing Kirka.io".to_string(),
        details: String::new(),
        join_url: "redline://".to_string(),
    }));

    let drpc_thread = drpc.clone();

    {
        let mut drpc_lock = drpc.lock().unwrap();
        set_status_internal(&mut drpc_lock, &initial_url).unwrap();
    }

    spawn(move || {
        drpc_thread.lock().unwrap().client.connect().unwrap();

        update_activity(&mut drpc_thread.lock().unwrap());

        loop {
            update_activity(&mut drpc_thread.lock().unwrap());
            sleep(Duration::from_secs(15));
        }
    });

    *instance = Some(drpc);
}

fn set_status_internal(drpc: &mut Drpc, url: &str) -> Result<()> {
    let parsed_url = Parser::new(None).parse(&url).map_err(napi_err)?;
    let host = parsed_url
        .host_str()
        .ok_or_else(|| napi_err("Invalid host"))?;
    let path = format!("/{}", parsed_url.path.unwrap_or_default().join("/"));

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
        drpc.protocol.clone()
    } else {
        format!("{}?url={}", drpc.protocol, path)
    };

    Ok(())
}

#[napi]
pub fn set_status(url: String) -> Result<()> {
    let instance = INSTANCE.lock().unwrap();
    let drpc = instance
        .as_ref()
        .ok_or_else(|| napi_err("DRPC not initialized."))?;
    let drpc_clone = drpc.clone();

    spawn(move || {
        set_status_internal(&mut drpc_clone.lock().unwrap(), &url).ok();
    });

    Ok(())
}

fn update_activity(drpc: &mut Drpc) {
    let mut buttons = vec![Button::new(
        "Download Client",
        "https://github.com/robertpakalns/redline-client/releases/latest",
    )];

    if drpc.join_btn {
        buttons.insert(0, Button::new("Join Game", &drpc.join_url));
    } else {
        buttons.push(Button::new(
            "Community Server",
            "https://discord.gg/cTE6CVuGen",
        ));
    }

    let act = Activity::new()
        .state(&drpc.state)
        .details(&drpc.details)
        .timestamps(Timestamps::new().start(drpc.start_ts))
        .buttons(buttons)
        .assets(Assets::new().large_image("redline"));

    drpc.client.set_activity(act).map_err(napi_err).unwrap();
}
