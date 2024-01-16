mod utils;

use std::collections::VecDeque;

use faster_hex::hex_string;
use futures::{prelude::*, StreamExt};
use js_sys::{self, JsString, Uint8Array};
use utils::set_panic_hook;
use wasm_bindgen::prelude::*;
use web_sys::{self, Document};

#[wasm_bindgen(start)]
pub fn init() {
    set_panic_hook();
}

#[wasm_bindgen]
pub enum DigestAlgorithm {
    MD5,
    SHA1,
    SHA256,
    SHA384,
    SHA512,
    SM3,
}

#[wasm_bindgen]
pub async fn digest(
    algorithm: DigestAlgorithm,
    raw_stream: web_sys::ReadableStream,
    callback: Option<js_sys::Function>,
) -> Result<String, JsValue> {
    use digest::*;
    use wasm_streams::ReadableStream;

    let convert = ReadableStream::from_raw(raw_stream);
    let mut stream = convert.into_stream();
    let mut hasher: Box<dyn DynDigest> = match algorithm {
        DigestAlgorithm::MD5 => Box::new(md5::Md5::new()),
        DigestAlgorithm::SHA1 => Box::new(sha1::Sha1::new()),
        DigestAlgorithm::SHA256 => Box::new(sha2::Sha256::new()),
        DigestAlgorithm::SHA384 => Box::new(sha2::Sha384::new()),
        DigestAlgorithm::SHA512 => Box::new(sha2::Sha512::new()),
        DigestAlgorithm::SM3 => Box::new(sm3::Sm3::new()),
    };

    let mut processed_size = 0f64;
    // TODO: 目前是同步地读取数据，可以考虑buffer一下
    loop {
        match stream.next().await {
            Some(Ok(trunk)) => {
                if let Some(data) = trunk.dyn_ref::<Uint8Array>() {
                    hasher.update(&data.to_vec());
                    processed_size += data.length() as f64;
                    if let Some(ref cb) = callback {
                        cb.call1(&JsValue::null(), &JsValue::from(processed_size))
                            .unwrap();
                    }
                } else {
                    web_sys::console::log_2(&JsValue::from("wtf"), &trunk);
                };
            }
            Some(Err(error)) => break Err(error),
            None => break Ok(hex_string(&hasher.finalize())),
        }
    }
}
