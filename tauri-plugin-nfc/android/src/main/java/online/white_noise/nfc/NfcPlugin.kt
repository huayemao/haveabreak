package online.white_noise.nfc

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.IOException

@InvokeArg
class WriteImageArgs {
    var epdColor: Int = 0
    var epdInch: Int = 0
    var initCmd1: String = ""
    var initCmd2: String = ""
    var bwData: List<Int>? = null
    var rwData: List<Int>? = null
}

@TauriPlugin
class NfcPlugin(private val activity: Activity) : Plugin(activity) {

    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private var writeFilters: Array<IntentFilter>? = null

    // Cached write data
    private var pendingWriteData: WriteData? = null
    private var isWriting = false

    // NFC state tracking
    private var isNfcEnabledByUser = false
    private var isActivityResumed = false

    data class WriteData(
        val epdColor: Int,
        val epdInch: Int,
        val initCmd1: String,
        val initCmd2: String,
        val bwData: ByteArray,
        val rwData: ByteArray?
    )

    // ────────────────────────────────────────────────────────────────────────
    //  Commands callable from JS
    // ────────────────────────────────────────────────────────────────────────

    @Command
    fun enable_nfc(invoke: Invoke) {
        try {
            nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
            isNfcEnabledByUser = true

            val result = JSObject()
            if (nfcAdapter == null) {
                result.put("supported", false)
                result.put("enabled", false)
                invoke.resolve(result)
                return
            }
            result.put("supported", true)
            result.put("enabled", nfcAdapter!!.isEnabled)

            if (isActivityResumed && nfcAdapter!!.isEnabled) {
                try {
                    enableForegroundDispatch()
                } catch (e: Exception) {
                    result.put("dispatchError", e.javaClass.simpleName + ": " + e.message)
                }
            }
            invoke.resolve(result)
        } catch (e: Exception) {
            val error = JSObject()
            error.put("supported", false)
            error.put("enabled", false)
            error.put("error", "Kotlin异常 [${e.javaClass.simpleName}]: ${e.message}")
            error.put("stackTrace", android.util.Log.getStackTraceString(e))
            invoke.resolve(error)
        }
    }

    @Command
    fun disable_nfc(invoke: Invoke) {
        isNfcEnabledByUser = false
        disableForegroundDispatch()
        invoke.resolve(JSObject().apply { put("ok", true) })
    }

    @Command
    fun write_image(invoke: Invoke) {
        val args = invoke.parseArgs(WriteImageArgs::class.java)

        val bwList = args.bwData ?: emptyList()
        val bwData = ByteArray(bwList.size) { bwList[it].toByte() }

        val rwData: ByteArray? = args.rwData?.let { rwList ->
            ByteArray(rwList.size) { rwList[it].toByte() }
        }

        pendingWriteData = WriteData(args.epdColor, args.epdInch, args.initCmd1, args.initCmd2, bwData, rwData)

        val res = JSObject()
        res.put("ready", true)
        res.put("message", "准备就绪，请将手机贴近墨水屏")
        invoke.resolve(res)
    }

    // ────────────────────────────────────────────────────────────────────────
    //  NFC lifecycle (Tauri v2 Plugin lifecycle hooks)
    // ────────────────────────────────────────────────────────────────────────

    override fun onResume() {
        super.onResume()
        isActivityResumed = true
        if (isNfcEnabledByUser && nfcAdapter?.isEnabled == true) {
            try {
                enableForegroundDispatch()
            } catch (_: Exception) {}
        }
    }

    override fun onPause() {
        isActivityResumed = false
        disableForegroundDispatch()
        super.onPause()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (NfcAdapter.ACTION_TAG_DISCOVERED != intent.action &&
            NfcAdapter.ACTION_TECH_DISCOVERED != intent.action) return

        val tag: Tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG) ?: return
        val data = pendingWriteData ?: return

        if (isWriting) return
        isWriting = true

        Thread {
            try {
                doWrite(tag, data)
            } finally {
                isWriting = false
            }
        }.start()
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Core NFC write logic
    // ────────────────────────────────────────────────────────────────────────

    private fun doWrite(tag: Tag, data: WriteData) {
        val tech = tag.techList
        if (!tech.contains("android.nfc.tech.IsoDep")) {
            emitError("标签类型不兼容（需要 IsoDep）", "HARDWARE_INCOMPATIBLE", "kotlin", "tagCheck")
            return
        }

        val isodep = IsoDep.get(tag)
        try {
            isodep.timeout = 50000
            if (!isodep.isConnected) isodep.connect()

            emitProgress(0, "NFC 已连接，正在初始化屏幕…")

            // 1. IC DIY command
            try {
                isodep.transceive(hexToBytes("F0DB020000"))
            } catch (e: IOException) {
                emitError("IC DIY 指令发送失败: ${e.message}", "ISO_DEP_IO", "kotlin", "icDiyCommand")
                return
            }
            delay(10)

            // 2. EPD init cmd 1
            try {
                isodep.transceive(hexToBytes(data.initCmd1))
            } catch (e: IOException) {
                emitError("屏幕初始化指令1发送失败: ${e.message}", "ISO_DEP_IO", "kotlin", "initCmd1")
                return
            }
            delay(10)

            // 3. EPD screen switch cmd 2
            val resp2: ByteArray
            try {
                resp2 = isodep.transceive(hexToBytes(data.initCmd2))
            } catch (e: IOException) {
                emitError("屏幕切换指令发送失败: ${e.message}", "ISO_DEP_IO", "kotlin", "initCmd2")
                return
            }
            delay(10)

            if (resp2.isEmpty() || resp2[0] != 0x90.toByte()) {
                val respHex = resp2.joinToString("") { "%02X".format(it) }
                emitError("屏幕初始化失败，响应: $respHex", "INVALID_RESPONSE", "kotlin", "initCmd2Response")
                return
            }

            // 4. Transfer image data
            val totalBytesAll = data.bwData.size + (data.rwData?.size ?: 0)
            var sentBytes = 0

            try {
                sentBytes += sendChannel(isodep, data.bwData, 0x00, sentBytes, totalBytesAll)
                if (data.rwData != null) {
                    sentBytes += sendChannel(isodep, data.rwData, 0x01, sentBytes, totalBytesAll)
                }
            } catch (e: IOException) {
                emitError("数据传输中断: ${e.message}", "DATA_TRANSFER_IO", "kotlin", "dataTransfer")
                return
            }

            emitProgress(100, "数据传输完成，屏幕刷新中…")

            // 5. Refresh command
            val refreshByte: Byte = if (data.epdColor == 4) 0x85.toByte() else 0x05.toByte()
            val refreshCmd = byteArrayOf(0xF0.toByte(), 0xD4.toByte(), refreshByte, 0x80.toByte(), 0x00.toByte())
            val refreshResp: ByteArray
            try {
                refreshResp = isodep.transceive(refreshCmd)
            } catch (e: IOException) {
                emitError("刷新指令发送失败: ${e.message}", "REFRESH_IO", "kotlin", "refreshCommand")
                return
            }

            if (refreshResp.isNotEmpty() && refreshResp[0] == 0x90.toByte()) {
                val waitSecs = when (data.epdColor) { 3 -> 16; 4 -> 20; else -> 2 }
                emitSuccess("屏幕正在刷新，预计需要 ${waitSecs} 秒")
            } else {
                val respHex = refreshResp.joinToString("") { "%02X".format(it) }
                emitError("刷新指令响应错误: $respHex", "INVALID_REFRESH_RESPONSE", "kotlin", "refreshResponse")
            }

        } catch (e: IOException) {
            emitError("NFC 通信断开: ${e.message}", "NFC_CONNECTION_LOST", "kotlin", "doWrite")
        } catch (e: Exception) {
            emitError("未知错误: ${e.message}", "UNKNOWN_EXCEPTION", "kotlin", "doWrite", android.util.Log.getStackTraceString(e))
        } finally {
            try { isodep.close() } catch (_: IOException) {}
        }
    }

    private fun sendChannel(
        isodep: IsoDep,
        channelData: ByteArray,
        screenIndex: Int,
        alreadySent: Int,
        total: Int
    ): Int {
        val chunkSize = 250
        val chunks = channelData.size / chunkSize
        for (i in 0 until chunks) {
            val cmd = ByteArray(chunkSize + 5)
            cmd[0] = 0xF0.toByte()
            cmd[1] = 0xD2.toByte()
            cmd[2] = screenIndex.toByte()
            cmd[3] = i.toByte()
            cmd[4] = 0xFA.toByte()
            System.arraycopy(channelData, i * chunkSize, cmd, 5, chunkSize)
            isodep.transceive(cmd)

            val pct = ((alreadySent + (i + 1) * chunkSize).toFloat() / total * 100).toInt().coerceAtMost(99)
            emitProgress(pct, "正在写入数据 $pct%…")
        }
        val remainder = channelData.size % chunkSize
        if (remainder > 0) {
            val cmd = ByteArray(chunkSize + 5)
            cmd[0] = 0xF0.toByte()
            cmd[1] = 0xD2.toByte()
            cmd[2] = screenIndex.toByte()
            cmd[3] = chunks.toByte()
            cmd[4] = 0xFA.toByte()
            System.arraycopy(channelData, chunks * chunkSize, cmd, 5, remainder)
            for (j in remainder until chunkSize) cmd[5 + j] = 0xFF.toByte()
            isodep.transceive(cmd)
        }
        return channelData.size
    }

    // ────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ────────────────────────────────────────────────────────────────────────

    private fun emitProgress(pct: Int, msg: String) {
        val obj = JSObject()
        obj.put("progress", pct)
        obj.put("message", msg)
        trigger("write-progress", obj)
    }

    private fun emitSuccess(msg: String) {
        val obj = JSObject()
        obj.put("message", msg)
        trigger("write-success", obj)
        pendingWriteData = null
    }

    private fun emitError(msg: String, code: String? = null, layer: String = "kotlin", phase: String? = null, detail: String? = null) {
        val obj = JSObject()
        obj.put("message", msg)
        if (code != null) obj.put("code", code)
        obj.put("layer", layer)
        if (phase != null) obj.put("phase", phase)
        if (detail != null) obj.put("detail", detail)
        trigger("write-error", obj)
    }

    private fun enableForegroundDispatch() {
        val intent = Intent(activity, activity.javaClass).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        pendingIntent = PendingIntent.getActivity(activity, 0, intent, PendingIntent.FLAG_MUTABLE)
        writeFilters = arrayOf(IntentFilter(NfcAdapter.ACTION_TAG_DISCOVERED))
        nfcAdapter?.enableForegroundDispatch(activity, pendingIntent, writeFilters, null)
    }

    private fun disableForegroundDispatch() {
        nfcAdapter?.disableForegroundDispatch(activity)
    }

    private fun delay(ms: Long) {
        try { Thread.sleep(ms) } catch (_: InterruptedException) {}
    }

    private fun hexToBytes(hex: String): ByteArray {
        val len = hex.length
        val data = ByteArray(len / 2)
        for (i in 0 until len / 2) {
            data[i] = ((hex[i * 2].digitToInt(16) shl 4) + hex[i * 2 + 1].digitToInt(16)).toByte()
        }
        return data
    }
}
