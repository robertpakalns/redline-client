# 🚀 Build Project Locally
1. Prerequisites:
- [Node.js](https://nodejs.org/)
- [Rust & rustup](https://rustup.rs/)

2. Clone the repository:
```bash
git clone https://github.com/robertpakalns/redline-client.git
cd redline-client
```
3. Build rust plugins
```bash
npm i
# napi should be installed via npm as @napi-rs/cli
cd src-rust/analytics && npx napi build --release
cd ../drpc && npx napi build --release
cd ../../
```

4. Move `.node` Files:
```bash
# Find out your system's triplet name
rustc -vV  # Look for the 'host' field, e.g., x86_64-pc-windows-msvc

# Replace {triplet} with your actual triplet name
mkdir -p rust-plugins/{triplet}
cp src-rust/analytics/analytics.node rust-plugins/{triplet}/
cp src-rust/drpc/drpc.node rust-plugins/{triplet}/
```

5. Build Electron Client:
```bash
npm run build
```

Contributions are open and welcome! Feel free to open issues or submit a pull request.