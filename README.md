![Downloads](https://img.shields.io/github/downloads/robertpakalns/redline-client/total)
![License](https://img.shields.io/github/license/robertpakalns/redline-client)
![GitHub stars](https://img.shields.io/github/stars/robertpakalns/redline-client)
![GitHub forks](https://img.shields.io/github/forks/robertpakalns/redline-client)
![GitHub last commit](https://img.shields.io/github/last-commit/robertpakalns/redline-client)
![Languages](https://img.shields.io/github/languages/top/robertpakalns/redline-client)

<h1 style="font-size: 2em; display: flex; align-items: center">
    <img src="https://raw.githubusercontent.com/robertpakalns/redline-client/main/assets/icons/icon.png" style="height: 1em; margin-right: 5px">
    <span>Redline Client</span>
</h1>
Unofficial Electron client for Kirka.io
<br><br>

<p align="center">
  <a href="https://github.com/robertpakalns/redline-client/releases/latest">
    <img src="https://img.shields.io/badge/Download-GitHub_Releases-blue?style=for-the-badge&logo=github&logoColor=white" />
  </a>

  <a href="https://discord.gg/cTE6CVuGen">
    <img src="https://img.shields.io/badge/Join-Discord-5661F5?style=for-the-badge&logo=discord&logoColor=white" />
  </a>

  <a href="https://tricko.pro/redline">
    <img src="https://img.shields.io/badge/Visit-Tricko.pro-black?style=for-the-badge&logo=Google-Chrome&logoColor=white" />
  </a>
</p>

## 📥 Download Client
1. Visit the [GitHub releases](https://github.com/robertpakalns/redline-client/releases/latest)
2. Download the installer for your operating system:
   - Windows: `.exe`
   - macOS: `.dmg`
   - Linux: `.AppImage` or `.tar.gz`
3. Run the installer

## ⚙️ Engine
Redline Client uses Electron version `37.2.1`, which supports the latest web standards. However, this Electron version is known for a bug that freezes any active WebSocket connection when run with the `--disable-frame-rate-limit` flag. To prevent this issue, the client uses the [`@juice-client/node-enject`](https://www.npmjs.com/package/@juice-client/node-enject) package, which resolves the problem on Windows. More information in [`package.json`](https://github.com/robertpakalns/redline-client/blob/main/package.json).

## 🛡️ Client Safety
This project is open-source. All Redline Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/redline-client). All builds are executed via GitHub Actions. If you have concerns about the safety of your private information while using Redline Client, feel free to inspect the source code. Trust in the client is based on trust in the developer.

## 🔗 Deeplink
Voxtulate Client uses `voxtulate:` protocol to open the client. For example, `voxtulate://?url=path/to/page` opens the client with the page `https://voxiom.io/path/to/page`. [More information](https://github.com/robertpakalns/VoxtulateClient/wiki/Deeplinks).

## 🔧 Default Keybinding
| Key        | Action                 |
|------------|------------------------|
| `Escape`   | Close Modal Window     |
| `F1`       | Open Menu Window       |
| `F5`       | Reload Page            |
| `F11`      | Toggle Fullscreen Mode |
| `F12`      | Toggle Developer Tools |

## 🚀 Features
* Adblocker
* Changelog
* Client, OS, and Engine Stats in-game
* Customizations
   * Custom Keybinding
   * Fast CSS
   * Userscripts
   * Userstyles
   * Resource Swapper
* Deeplinks (`redline:` Protocol)
* Discord Rich Presence
* FPS Uncap (Windows Only)
* Import/Export Client Settings
* Menu Modal (`F1`)
* Popup Messages
* Proxy Domains Support
* Tricko Links in Player Modals

## 🖼️ Menu Modal
To open the menu modal, press `F1`. You can change the key in the Menu Modal.

## 🔄 Resource Swapper
To use the swapper:
1. Make sure you enabled it in the menu modal settings section
2. Get the file URL you want to swap and extract only the file name and extension
3. Go to `%userprofile%/Documents/RedlineClient/swapper` and place the file there
4. Reload the client to apply changes
5. [Example with Voxtulate Client (Extended Swapper)](https://github.com/robertpakalns/VoxtulateClient/wiki/Resource-Swapper)

## 🧑‍💻 Credits
* xip for Kirka.io
* Voxtulate Client (robertpakalns) for core features
* Juice Client (irrvlo) for additional features
* PVT and CarrySheriff for the client assets
* slavcp for enject

In partnership with Kirka.io clan [`ImOn_Smoko`](https://discord.gg/BBchaJvZVU)

by robertpakalns