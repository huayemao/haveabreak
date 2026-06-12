use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NfcStatus {
    pub supported: bool,
    pub enabled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stack_trace: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dispatch_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WriteImageArgs {
    pub epd_color: i32,
    pub epd_inch: i32,
    pub init_cmd1: String,
    pub init_cmd2: String,
    pub bw_data: Vec<u8>,
    pub rw_data: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritePrepareResult {
    pub ready: bool,
    pub message: String,
}
