#[cfg(any(target_os = "android", target_os = "ios"))]
use tauri::Manager;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

pub use models::*;

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
mod desktop;

#[cfg(any(target_os = "android", target_os = "ios"))]
mod mobile;

mod commands;
mod error;
mod models;

pub use error::{Error, Result};

#[cfg(any(target_os = "android", target_os = "ios"))]
pub use mobile::NfcPlugin;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("nfc")
        .invoke_handler(tauri::generate_handler![
            commands::enable_nfc,
            commands::disable_nfc,
            commands::write_image,
        ])
        .setup(|app, api| {
            #[cfg(any(target_os = "android", target_os = "ios"))]
            {
                let nfc = mobile::init(app, api)?;
                app.manage(nfc);
            }
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                let _ = (app, api);
            }
            Ok(())
        })
        .build()
}
