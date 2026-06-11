 package online.white_noise.maoji

import android.app.Activity
import android.app.PendingIntent
import android.content.Intent
import android.content.IntentFilter
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Handler
import android.os.Looper
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.IOException

@TauriPlugin
class NfcPlugin(private val activity: Activity) : Plugin(activity) {

    private var nfcAdapter: NfcAdapter? = null
    private var pendingIntent: PendingIntent? = null
    private var writeFilters: Array<IntentFilter>? = null

    // Cached write data
    private var pendingWriteData: WriteData? = null
    private var isWriting = false

    data class WriteData(
        val epdColor: Int,        // 2=BW, 3=BWR, 4=4G
        val epdInch: Int,         // e.g. 213, 290, 266…
        val initCmd1: String,     // hex string
        val initCmd2: String,     // hex string
        val bwData: ByteArray,    // Black/White channel data
        val rwData: ByteArray?    // Red/White channel data (3-color) or null
    )

    // ────────────────────────────────────────────────────────────────────────
    //  Commands callable from JS
    // ────────────────────────────────────────────────────────────────────────

    @Command
    fun enableNfc(invoke: Invoke) {
        try {
            nfcAdapter = NfcAdapter.getDefaultAdapter(activity)
            val result = JSObject()
            if (nfcAdapter == null) {
                result.put("supported", false)
                result.put("enabled", false)
                invoke.resolve(result)
                return
            }
            result.put("supported", true)
            result.put("enabled", nfcAdapter!!.isEnabled)

            if (nfcAdapter!!.isEnabled) {
                try {
                    enableForegroundDispatch()
                } catch (e: Exception) {
                    // 前台分发注册失败不影响 NFC 检测，但记录错误信息
                    result.put("dispatchError", e.javaClass.simpleName + ": " + e.message)
                }
            }
            invoke.resolve(result)
        } catch (e: Exception) {
            // 整个 enableNfc 崩溃时，将详细错误返回给 JS
            val error = JSObject()
            error.put("supported", false)
            error.put("enabled", false)
            error.put("error", e.javaClass.simpleName + ": " + e.message)
            error.put("stackTrace", android.util.Log.getStackTraceString(e))
            invoke.resolve(error)
        }
    }

    @Command
    fun disableNfc(invoke: Invoke) {
        disableForegroundDispatch()
        invoke.resolve(JSObject().apply { put("ok", true) })
    }

    /**
     * JS should call this BEFORE tapping the NFC tag.
     * Expects invoke.args:
     *   epdColor: number
     *   epdInch:  number
     *   initCmd1: string  (hex)
     *   initCmd2: string  (hex)
     *   bwData:   number[] (byte values 0-255)
     *   rwData:   number[] | null
     */
    @Command
    fun writeImage(invoke: Invoke) {
        val args = invoke.parseArgs(JSObject::class.java)

        val epdColor = args.getInt("epdColor")
        val epdInch  = args.getInt("epdInch")
        val initCmd1 = args.getString("initCmd1") ?: ""
        val initCmd2 = args.getString("initCmd2") ?: ""

        val bwArray  = args.getJSONArray("bwData")
        val bwData   = ByteArray(bwArray.length()) { bwArray.getInt(it).toByte() }

        val rwData: ByteArray? = if (args.has("rwData") && !args.isNull("rwData")) {
            val rwArray = args.getJSONArray("rwData")
            ByteArray(rwArray.length()) { rwArray.getInt(it).toByte() }
        } else null

        pendingWriteData = WriteData(epdColor, epdInch, initCmd1, initCmd2, bwData, rwData)

        val res = JSObject()
        res.put("ready", true)
        res.put("message", "准备就绪，请将手机贴近墨水屏")
        invoke.resolve(res)
    }

    // ────────────────────────────────────────────────────────────────────────
    //  NFC lifecycle
    // ────────────────────────────────────────────────────────────────────────

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
    //  Core NFC write logic (ported from activity_imageview.java)
    // ────────────────────────────────────────────────────────────────────────

    private fun doWrite(tag: Tag, data: WriteData) {
        val tech = tag.techList
        if (!tech.contains("android.nfc.tech.IsoDep")) {
            emitError("标签类型不兼容（需要 IsoDep）")
            return
        }

        val isodep = IsoDep.get(tag)
        try {
            isodep.timeout = 50000
            if (!isodep.isConnected) isodep.connect()

            emitProgress(0, "NFC 已连接，正在初始化屏幕…")

            // 1. IC DIY command
            isodep.transceive(hexToBytes("F0DB020000"))
            delay(10)

            // 2. EPD init cmd 1
            isodep.transceive(hexToBytes(data.initCmd1))
            delay(10)

            // 3. EPD screen switch cmd 2
            val resp2 = isodep.transceive(hexToBytes(data.initCmd2))
            delay(10)

            if (resp2.isEmpty() || resp2[0] != 0x90.toByte()) {
                emitError("屏幕初始化失败")
                return
            }

            // 4. Transfer image data
            val totalBytesAll = data.bwData.size + (data.rwData?.size ?: 0)
            var sentBytes = 0

            // BW channel
            sentBytes += sendChannel(isodep, data.bwData, 0x00, sentBytes, totalBytesAll)

            // RW channel (3-color or special 2-color cases)
            if (data.rwData != null) {
                sentBytes += sendChannel(isodep, data.rwData, 0x01, sentBytes, totalBytesAll)
            }

            emitProgress(100, "数据传输完成，屏幕刷新中…")

            // 5. Refresh command
            val refreshByte: Byte = if (data.epdColor == 4) 0x85.toByte() else 0x05.toByte()
            val refreshCmd = byteArrayOf(0xF0.toByte(), 0xD4.toByte(), refreshByte, 0x80.toByte(), 0x00.toByte())
            val refreshResp = isodep.transceive(refreshCmd)

            if (refreshResp.isNotEmpty() && refreshResp[0] == 0x90.toByte()) {
                val waitSecs = when (data.epdColor) { 3 -> 16; 4 -> 20; else -> 2 }
                emitSuccess("屏幕正在刷新，预计需要 ${waitSecs} 秒")
            } else {
                emitError("刷新指令响应错误")
            }

        } catch (e: IOException) {
            emitError("NFC 通信断开: ${e.message}")
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
        // tail
        val remainder = channelData.size % chunkSize
        if (remainder > 0) {
            val cmd = ByteArray(chunkSize + 5)
            cmd[0] = 0xF0.toByte()
            cmd[1] = 0xD2.toByte()
            cmd[2] = screenIndex.toByte()
            cmd[3] = chunks.toByte()
            cmd[4] = 0xFA.toByte()
            System.arraycopy(channelData, chunks * chunkSize, cmd, 5, remainder)
            // pad rest with 0xFF
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

    private fun emitError(msg: String) {
        val obj = JSObject()
        obj.put("message", msg)
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
