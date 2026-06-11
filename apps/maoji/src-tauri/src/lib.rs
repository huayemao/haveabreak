#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(target_os = "android")]
            {
                app.handle()
                    .plugin(
                        tauri::plugin::Builder::<_, ()>::new("nfc")
                            .build(),
                    )
                    .expect("failed to register nfc plugin");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
