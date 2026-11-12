// lib/crypto.ts: the "lock and key" for text messages, used by the chat screens.

const enc = new TextEncoder(); // text -> bytes, because Web Crypto only works on bytes
const dec = new TextDecoder(); // bytes -> text, to show the opened message on screen
export const PREFIX = "e2e:v1:"; // sticker on every locked message, so old plain messages are recognised

// Bytes -> text string, so the locked box fits in the MySQL "content" column
function toBase64(bytes: Uint8Array): string {
    let s = ""; // builds one character per byte
    bytes.forEach((b) => (s += String.fromCharCode(b))); // byte number -> character
    return btoa(s); // btoa = browser's built-in base64 encoder
}

// Text string -> bytes, before unlocking
function fromBase64(text: string): Uint8Array {
    const s = atob(text); // atob = browser's built-in base64 decoder
    return Uint8Array.from(s, (c) => c.charCodeAt(0)); // character -> byte number
}

// Passphrase + room id -> AES key. The room id is the salt, so each room gets a different key.
export async function deriveRoomKey(passphrase: string, roomId: number): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey(
        "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
    ); // hands the passphrase bytes to the toolbox
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: enc.encode("chatapi-room-" + roomId), iterations: 100000, hash: "SHA-256" },
        baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    ); // the grinder: 100000 rounds makes guessing the passphrase slow
}

// Lock a message in the browser BEFORE it is sent to the Spring server
export async function encryptText(plain: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // fresh random number per message
    const box = new Uint8Array(
        await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain))
    ); // the locked box (message + tamper tag)
    return PREFIX + toBase64(iv) + ":" + toBase64(box); // sticker + iv + box as one text string
}

// Open a stored message. Returns null if it is not locked, or if the key is wrong.
export async function decryptText(stored: string, key: CryptoKey): Promise<string | null> {
    if (!stored.startsWith(PREFIX)) return null; // old plain message: caller shows it as it is
    try {
        const [ivText, boxText] = stored.slice(PREFIX.length).split(":"); // split iv and box
        const opened = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: fromBase64(ivText) }, key, fromBase64(boxText)
        ); // throws an error if the key is wrong or the data was changed
        return dec.decode(opened); // bytes -> readable text
    } catch {
        return null; // wrong passphrase: caller shows a lock label
    }
}