# Redline Client
Unofficial Electron client for Kirka.io

## Engine
Redline Client uses Electron version `36.5.0`, which supports the latest web standards. However, this Electron version is known for a bug that freezes any active WebSocket connection when run with the `--disable-frame-rate-limit` flag. To prevent this issue, the client uses the `@juice-client/node-enject` package, which resolves the problem on Windows. More information in [`package.json`](https://github.com/robertpakalns/redline-client/blob/main/package.json).

## Client Safety
This project is open-source. All Redline Client source code is publicly available in the [GitHub repository](https://github.com/robertpakalns/redline-client). All builds are executed via GitHub Actions. If you have concerns about the safety of your private information while using Redline Client, feel free to inspect the source code. Trust in the client is based on trust in the developer.

## Features
* Adblocker
* Changelog
* Client and Engine Versions in-game
* Customizations
   * Custom Keybinding
   * Fast CSS
   * Userscripts
   * Userstyles
   * Resource Swapper
* Deeplinks (`redline:` Protocol)
* Discord Rich Presence
<!-- * Import/Export Game/Client Settings -->
* Menu Modal (`F1`)
* Proxy Domain Support
* Tricko Links in Player Modals

## Menu Modal
To open the menu modal, press `F1`.

## Resource Swapper
To use the swapper:
1. Make sure you enabled it in the menu modal settings section
2. Get the file URL you want to swap and extract only the file name and extension
3. Go to `%userprofile%/Documents/RedlineClient/swapper` and place the file there
4. Reload the client to apply changes
5. [Example with Voxtulate Client (Extended Swapper)](https://github.com/robertpakalns/VoxtulateClient/wiki/Resource-Swapper)

## Credits
* xip for Kirka.io
* Voxtulate Client (robertpakalns) for core features
* Juice Client (irrvlo) for additional features
* PVT and CarrySheriff for the client logo

In partnership with Kirka clan [`ImOn_Smoko`](https://discord.gg/BBchaJvZVU)

[by robertpakalns](https://github.com/robertpakalns) | [Community Server](https://discord.gg/cTE6CVuGen) | [Powered by Tricko](https://discord.gg/yPjrUrvSzv)