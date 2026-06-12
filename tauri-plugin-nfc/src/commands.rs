use crate::{NfcStatus, Result, WriteImageArgs, WritePrepareResult};
use tauri::command;

#[cfg(any(target_os = "android", target_os = "ios"))]
use crate::NfcPlugin;
#[cfg(any(target_os = "android", target_os = "ios"))]
use tauri::Runtime;

#[cfg(any(target_os = "android", target_os = "ios"))]
#[command]
pub async fn enable_nfc<R: Runtime>(
    _app: tauri::AppHandle<R>,
    nfc: tauri::State<'_, NfcPlugin<R>>,
) -> Result<NfcStatus> {
    nfc.enable_nfc()
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[command]
pub async fn enable_nfc() -> Result<NfcStatus> {
    Ok(NfcStatus {
        supported: false,
        enabled: false,
        error: Some("NFC not supported on this platform".to_string()),
        stack_trace: None,
        dispatch_error: None,
    })
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[command]
pub async fn disable_nfc<R: Runtime>(
    _app: tauri::AppHandle<R>,
    nfc: tauri::State<'_, NfcPlugin<R>>,
) -> Result<()> {
    nfc.disable_nfc()
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[command]
pub async fn disable_nfc() -> Result<()> {
    Ok(())
}

#[cfg(any(target_os = "android", target_os = "ios"))]
#[command]
pub async fn write_image<R: Runtime>(
    _app: tauri::AppHandle<R>,
    nfc: tauri::State<'_, NfcPlugin<R>>,
    args: WriteImageArgs,
) -> Result<WritePrepareResult> {
    nfc.write_image(args)
}

#[cfg(not(any(target_os = "android", target_os = "ios")))]
#[command]
pub async fn write_image(_args: WriteImageArgs) -> Result<WritePrepareResult> {
    Ok(WritePrepareResult {
        ready: false,
        message: "NFC not supported on this platform".to_string(),
    })
}
