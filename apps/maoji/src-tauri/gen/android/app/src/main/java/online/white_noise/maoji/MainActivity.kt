package online.white_noise.maoji
import android.os.Bundle
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
    }

    override fun onResume() {
        super.onResume()
        getNfcPlugin()?.onActivityResume()
    }

    override fun onPause() {
        getNfcPlugin()?.onActivityPause()
        super.onPause()
    }

    private fun getNfcPlugin(): NfcPlugin? {
        return try {
            bridge?.getPlugin("nfc") as? NfcPlugin
        } catch (_: Exception) {
            null
        }
    }
}
