package online.white_noise.maoji

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import app.tauri.TauriActivity

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Tauri propagates this to registered plugins automatically
    }

    override fun onResume() {
        super.onResume()
    }

    override fun onPause() {
        super.onPause()
    }
}
