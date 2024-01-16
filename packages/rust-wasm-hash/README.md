# rust-wasm-hash

计算 hash

## build

```sh
cargo build --release --target=wasm32-unknown-unknown && wasm-bindgen --out-dir src/wasm/wasmhash/pkg target/wasm32-unknown-unknown/release/wasmhash.wasm
bun run build
```
