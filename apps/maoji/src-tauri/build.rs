fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().plugin(
            "nfc",
            tauri_build::InlinedPlugin::new()
                .commands(&["enable_nfc", "disable_nfc", "write_image"]),
        ),
    )
    .expect("failed to run tauri-build");
}
