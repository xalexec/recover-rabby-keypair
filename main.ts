import { Level } from "level";
import readline from "readline";

import path from "path";
import os from "os";
import crypto from "crypto";
import fs from "fs";

interface Vault {
  data: string;
  iv: string;
  salt: string;
}

const RABBY_DB_PATH = path.join(
  os.homedir(),
  // ModuleError: Iterator is not open
  // 如何 Chrome 正打使用会报错，请关闭
  "Library/Application Support/Google/Chrome/Default/Local Extension Settings/acmacodkjbdgmoleebolmdjonilkdbch"
);

function tryDecode(data: string): Uint8Array {
  if (/^[0-9a-f]+$/i.test(data) && data.length % 2 === 0) {
    return Uint8Array.from(Buffer.from(data, "hex"));
  } else {
    return Uint8Array.from(Buffer.from(data, "base64"));
  }
}

function decryptVault(vault: Vault, password: string): string {
  const iv = tryDecode(vault.iv);
  const salt = tryDecode(vault.salt);
  const encryptedBuffer = tryDecode(vault.data);

  const ciphertext = encryptedBuffer.slice(0, -16);
  const authTag = encryptedBuffer.slice(-16);

  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, "sha256");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Uint8Array.from(key),
    iv
  );
  decipher.setAuthTag(Uint8Array.from(authTag));

  const decrypted = Buffer.concat([
    Uint8Array.from(decipher.update(Uint8Array.from(ciphertext))),
    Uint8Array.from(decipher.final()),
  ]);

  return decrypted.toString("utf8");
}

async function extractVault(): Promise<Vault | null> {
  const db = new Level<string, string>(RABBY_DB_PATH, {
    valueEncoding: "utf8",
  });
  let result: Vault | null = null;

  try {
    for await (const [key, value] of db.iterator()) {
      if (value.includes('"vault"')) {
        try {
          const outer = JSON.parse(value);
          const raw = outer.vault || outer.data?.vault;
          result = typeof raw === "string" ? JSON.parse(raw) : raw;
          break;
        } catch (e) {
          console.warn("⚠️ 无法解析 vault 数据：", e);
        }
      }
    }
  } catch (err) {
    console.error("❗ LevelDB 读取失败：", err);
  }

  await db.close();
  return result;
}
async function promptPassword(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    (rl as any).stdoutMuted = true;

    rl.question("🔑 请输入 Rabby 密码：", (password: string) => {
      console.log("\n");
      rl.close();
      resolve(password);
    });

    (rl as any)._writeToOutput = function (_stringToWrite: string) {
      if ((rl as any).stdoutMuted) {
        (rl as any).output.write("*");
      } else {
        (rl as any).output.write(_stringToWrite);
      }
    };
  });
}
(async () => {
  console.log("📦 正在提取 Rabby 助记词 vault...\n");

  const vault = await extractVault();
  if (!vault) {
    console.error("❌ 未找到 vault 数据");
    return;
  }

  const PASSWORD = await promptPassword();
  if (!PASSWORD) {
    console.error("❌ 密码不能为空");
    process.exit(1);
  }
  try {
    const mnemonic = decryptVault(vault, PASSWORD);
    console.log(`✅ 解密成功！`);

    fs.writeFileSync("mnemonic.txt", mnemonic, "utf-8");
    console.log("\n📄 助记词已保存到 mnemonic.txt");
  } catch (e) {
    console.error("\n❌ 解密失败，可能是密码错误或数据损坏。\n", e);
  }
})();
