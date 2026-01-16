# 📝 About Project

## ⚙️ Engine
Redline Client uses one of the latest Electron versions, which supports the latest web standards. However, this Electron version is known for a bug that freezes any active WebSocket connection when run with the `--disable-frame-rate-limit` flag. To prevent this issue, the client uses the [`@juice-client/node-enject`](https://www.npmjs.com/package/@juice-client/node-enject) workaround, which resolves the problem on Windows.
More information about dependencies:
* [`package.json`](https://github.com/robertpakalns/redline-client/blob/main/package.json).
* [`Cargo.toml`](https://github.com/robertpakalns/redline-client/blob/main/src-rust/Cargo.toml).

## Build Technologies
* **Electron's `nodeIntegration: false`** prevents Node.js API from being accessible directly in the renderer process.
* **Vite** generates 2 separate scripts: one for the main process and one for the renderer process. This creates optimized bundles and a clear separation of main and renderer scripts.
* **TypeScript** ensures type safety and fewer runtime errors.
* **napi-rs** compiles Node modules which are used in the client.

# 🚀 Build Project Locally
1. Prerequisites:
- [Node.js](https://nodejs.org)
- [Rust & rustup](https://rustup.rs)

2. Clone the repository:
```bash
git clone https://github.com/robertpakalns/redline-client.git
cd redline-client
```
3. Build rust plugins
```bash
npm install --ignore-scripts

# napi should be installed via npm as @napi-rs/cli
npx napi build --release --platform --no-js --cwd src-rust/analytics
npx napi build --release --platform --no-js --cwd src-rust/drpc
```
Redline Client compiles two `.node` files per plugin:
- Windows: `x86_64-pc-windows-msvc` and `i686-pc-windows-msvc`
- macOS: `x86_64-apple-darwin` and `aarch64-apple-darwin`
- Linux: `x86_64-unknown-linux-gnu` and `aarch64-unknown-linux-gnu`

To build the client locally, you will need only one `.node` file for each plugin (`npx napi build --release --platform --no-js`).

5. Build Electron Client:
```bash
npm run build
```

Contributions are open and welcome! Feel free to open issues or submit a pull request.
