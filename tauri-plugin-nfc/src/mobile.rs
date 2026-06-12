use crate::{NfcStatus, Result, WriteImageArgs, WritePrepareResult};
use tauri::{plugin::PluginApi, AppHandle, Runtime};

pub fn init<R: Runtime, C: serde::de::DeserializeOwned>(
    _app: &AppHandle<R>,
    api: PluginApi<R, C>,
) -> Result<NfcPlugin<R>> {
    #[cfg(target_os = "android")]
    let handle = Some(
        api.register_android_plugin("online.white_noise.nfc", "NfcPlugin")
            .map_err(|e| crate::Error::Anyhow(e.to_string()))?,
    );
    #[cfg(not(target_os = "android"))]
    let handle = None;

    Ok(NfcPlugin { handle })
}

pub struct NfcPlugin<R: Runtime> {
    #[cfg(target_os = "android")]
    handle: Option<tauri::plugin::PluginHandle<R>>,
    #[cfg(not(target_os = "android"))]
    handle: Option<()>,
}

impl<R: Runtime> NfcPlugin<R> {
    pub fn enable_nfc(&self) -> Result<NfcStatus> {
        #[cfg(target_os = "android")]
        {
            if let Some(handle) = &self.handle {
                handle
                    .run_mobile_plugin("enable_nfc", serde_json::json!({}))
                    .map_err(|e| crate::Error::Anyhow(e.to_string()))
            } else {
                Ok(NfcStatus {
                    supported: false,
                    enabled: false,
                    error: Some("NFC not supported on this platform".to_string()),
                    stack_trace: None,
                    dispatch_error: None,
                })
            }
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(NfcStatus {
                supported: false,
                enabled: false,
                error: Some("NFC not supported on this platform".to_string()),
                stack_trace: None,
                dispatch_error: None,
            })
        }
    }

    pub fn disable_nfc(&self) -> Result<()> {
        #[cfg(target_os = "android")]
        {
            if let Some(handle) = &self.handle {
                handle
                    .run_mobile_plugin("disable_nfc", serde_json::json!({}))
                    .map_err(|e| crate::Error::Anyhow(e.to_string()))
            } else {
                Ok(())
            }
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(())
        }
    }

    pub fn write_image(&self, args: WriteImageArgs) -> Result<WritePrepareResult> {
        #[cfg(target_os = "android")]
        {
            if let Some(handle) = &self.handle {
                handle
                    .run_mobile_plugin("write_image", args)
                    .map_err(|e| crate::Error::Anyhow(e.to_string()))
            } else {
                Ok(WritePrepareResult {
                    ready: false,
                    message: "NFC not supported on this platform".to_string(),
                })
            }
        }
        #[cfg(not(target_os = "android"))]
        {
            Ok(WritePrepareResult {
                ready: false,
                message: "NFC not supported on this platform".to_string(),
            })
        }
    }
}
