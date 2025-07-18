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
cd src-rust/analytics
npx napi build --release --platform --js false

cd ../drpc
npx napi build --release --platform --js false

cd ../../
```
Redline Client compiles two `.node` files per plugin:
- Windows: `x86_64-pc-windows-msvc` and `i686-pc-windows-msvc`
- macOS: `x86_64-apple-darwin` and `aarch64-apple-darwin`
- Linux: `x86_64-unknown-linux-gnu` and `aarch64-unknown-linux-gnu`

To build the client locally, you will need only one `.node` file for each plugin (`npx napi build --release --platform --js false`).

5. Build Electron Client:
```bash
npm run build
```

Contributions are open and welcome! Feel free to open issues or submit a pull request.