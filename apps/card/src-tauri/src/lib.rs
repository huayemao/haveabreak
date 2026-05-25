use tauri::{Manager, utils::platform::current_locale};
use tauri_plugin_fs::FsExt;

const SUPPORTED_LANGUAGES: &[&str] = &["en", "zh", "de", "es", "fr", "it", "ja", "ko", "pt", "ru"];

fn get_language(locale: &str) -> String {
    let lang = locale.split(['-', '_']).next().unwrap_or(locale);
    let lang_lower = lang.to_lowercase();

    if SUPPORTED_LANGUAGES.contains(&lang_lower.as_str()) {
        lang_lower
    } else {
        "en".to_string()
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let locale = current_locale().unwrap_or_else(|| "en".to_string());
            let language = get_language(&locale);
            
            if let Some(window) = app.get_webview_window("main") {
                window.set_url(&format!("/{}/card", language)).unwrap();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}