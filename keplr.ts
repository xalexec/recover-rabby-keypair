import * as path from "path";
import levelup from "levelup";
import leveldown from "leveldown";
import * as crypto from "crypto";
import os from "os";
import { promptPassword } from "./util";
import fs from "fs";

// 📂 LevelDB 路径
const DB_PATH = path.join(
  os.homedir(),
  // ModuleError: Iterator is not open
  // 如何 Chrome 正打使用会报错，请关闭
  "Library/Application Support/Google/Chrome/Default/Local Extension Settings/dmkamcknogkgcdfhhbddcghachkejeap"
);

const vaultKeys = {
  aesCounterCipher: "",
  aesCounterSalt: "",
  userPasswordMac: "",
  userPasswordSalt: "",
  passwordCipher: "",
};

let encryptedMnemonicHex = "";

const ITERATIONS = 4000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function verifyPassword(password: string): {
  success: boolean;
  derivedKey?: Buffer;
} {
  const salt = Buffer.from(vaultKeys.userPasswordSalt, "hex");
  const expectedMac = Buffer.from(vaultKeys.userPasswordMac, "hex");

  const derivedKey = crypto.pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );

  const keyHalf = derivedKey.slice(16);
  const cipherHalf = Buffer.from(vaultKeys.passwordCipher, "hex").slice(16);
  const concat = Buffer.concat([keyHalf, cipherHalf]);
  const actualMac = crypto.createHash("sha256").update(concat).digest();

  const match = expectedMac.equals(actualMac);
  if (!match) console.error("❌ 密码验证失败");
  return { success: match, derivedKey };
}

function decryptMasterKey(derivedKey: Buffer): Buffer {
  const cipher = Buffer.from(vaultKeys.passwordCipher, "hex");
  const iv = Buffer.from(vaultKeys.userPasswordSalt, "hex");
  const decipher = crypto.createDecipheriv("aes-256-ctr", derivedKey, iv);
  return Buffer.concat([decipher.update(cipher), decipher.final()]);
}

function decryptMnemonicIV(masterKey: Buffer): Buffer {
  const cipher = Buffer.from(vaultKeys.aesCounterCipher, "hex");
  const iv = Buffer.from(vaultKeys.aesCounterSalt, "hex");
  const decipher = crypto.createDecipheriv("aes-256-ctr", masterKey, iv);
  return Buffer.concat([decipher.update(cipher), decipher.final()]);
}

function decryptMnemonic(
  masterKey: Buffer,
  mnemonicIV: Buffer,
  encryptedHex: string
): string {
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    masterKey,
    mnemonicIV
  );
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8"
  );
}

async function extractAndRecover() {
  const db = levelup(leveldown(DB_PATH));
  const PASSWORD = await promptPassword();
  if (!PASSWORD) {
    console.error("❌ 密码不能为空");
    process.exit(1);
  }
  return new Promise<void>((resolve, reject) => {
    db.createReadStream()
      .on("data", (data: any) => {
        const key = data.key.toString("utf8");
        const value = data.value.toString("utf8");

        if (key.startsWith("vault/")) {
          if (key.endsWith("aesCounterCipher"))
            vaultKeys.aesCounterCipher = JSON.parse(value);
          if (key.endsWith("aesCounterSalt"))
            vaultKeys.aesCounterSalt = JSON.parse(value);
          if (key.endsWith("userPasswordMac"))
            vaultKeys.userPasswordMac = JSON.parse(value);
          if (key.endsWith("userPasswordSalt"))
            vaultKeys.userPasswordSalt = JSON.parse(value);
          if (key.endsWith("passwordCipher"))
            vaultKeys.passwordCipher = JSON.parse(value);
        }

        if (key.startsWith("vault/vaultMap")) {
          try {
            const json = JSON.parse(value);
            const account = json.keyRing?.[0];
            const sensitive = account?.sensitive;
            if (
              sensitive &&
              typeof sensitive === "string" &&
              sensitive.startsWith("__uint8array__")
            ) {
              const hex = sensitive.replace("__uint8array__", "");
              encryptedMnemonicHex = hex;
            }
          } catch (e) {}
        }
      })
      .on("error", reject)
      .on("end", () => {
        const check = verifyPassword(PASSWORD);
        if (!check.success || !check.derivedKey || !encryptedMnemonicHex) {
          console.error("恢复失败：密码不正确或助记词数据缺失");
          return resolve();
        }

        const masterKey = decryptMasterKey(check.derivedKey);
        const mnemonicIV = decryptMnemonicIV(masterKey);
        const mnemonic = decryptMnemonic(
          masterKey,
          mnemonicIV,
          encryptedMnemonicHex
        );

        console.log("\n✅ 恢复助记词成功：");

        fs.writeFileSync("keplr-mnemonic.txt", mnemonic, "utf-8");
        console.log("\n📄 助记词已保存到 keplr-mnemonic.txt");
        resolve();
      });
  });
}

extractAndRecover().catch(console.error);
