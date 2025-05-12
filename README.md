# 🐰 Rabby Wallet 助记词恢复工具 / Mnemonic Recovery Tool

这是一个基于 Node.js + TypeScript 编写的命令行工具，允许你从浏览器中备份的 Rabby 钱包 LevelDB 数据中提取并解密加密的助记词。

如果你误删除了 Rabby 插件，只要你曾备份过 Chrome 的 `Local Extension Settings` 目录（或者启用了 Time Machine 自动备份），依然可以恢复助记词。

This is a command-line tool built with Node.js + TypeScript that allows you to extract and decrypt the encrypted mnemonic phrase from a backed-up Rabby Wallet LevelDB database.

If you accidentally deleted the Rabby extension, as long as you have a backup of Chrome's `Local Extension Settings` (e.g. via Time Machine), you can still recover your mnemonic phrase.

---

## ✨ 功能特性 / Features

- 🔍 自动读取本地 Rabby 钱包的 vault 数据

  Automatically reads local Rabby wallet `vault` data

- 🔐 使用 AES-256-GCM 解密助记词

  Decrypts the mnemonic using AES-256-GCM

- 🔁 使用 PBKDF2（迭代次数 10000）从密码派生密钥

  Derives the key using PBKDF2 (iteration: 10000)

- 🤫 支持命令行交互隐藏密码输入

  CLI password input with `*` masking support

- 📄 自动将助记词写入 mnemonic.txt

  Saves the decrypted mnemonic to `mnemonic.txt`

---

## 🧩 安装依赖 / Install Dependencies

```bash
pnpm i
```

---

## 🚀 使用方法 / How to Use

> 💡 建议使用 Rabby 数据目录的副本，避免与 Chrome 冲突
>
> 💡 Use a copied version of the LevelDB folder to avoid Chrome locking errors.

### 执行恢复脚本 / Run Recovery Tool

```bash
pnpm dlx ns-node rabby.ts
```

OR

```bash
pnpm run rabby
```

你将看到提示输入 Rabby 密码：

You'll be prompted to input your Rabby password:

```
🔑 请输入 Rabby 密码：
```

解密成功后，助记词会写入 `mnemonic.txt`

After successful decryption, mnemonic is written to `mnemonic.txt`

---

## ⚠️ 注意事项 / Warnings

- 建议提前备份 Rabby LevelDB 数据目录
- Rabby 原始目录可能被 Chrome 占用，请使用副本
- 密码错误或数据损坏将导致解密失败

- Make sure to back up the LevelDB directory
- Do not access the original folder while Chrome is running
- Incorrect password or corrupted data will cause decryption failure

---

## ☕ 请我喝杯咖啡 / Buy Me a Coffee

如果你觉得这个工具对你有帮助，欢迎通过下方地址支持我继续维护它。

If this tool helped you, feel free to support my work by buying me a coffee:

```
0xD8b4Ae7E5788E66e389C3E95cA37Fb4aA9D34403
```

## 💬 输出示例 / Output Example

```
📦 正在提取 Rabby 助记词 vault...
🔐 找到 vault，加密内容如下：
✅ 解密成功！
📄 助记词已保存到 mnemonic.txt
```

---

## 🛡️ 安全提示 / Security Tips

- ❗ 请妥善保存你的助记词，不要泄露
- ❗ 建议恢复后删除 mnemonic.txt
- ❗ 本工具仅供恢复你自己的钱包使用

- ❗ Never share your mnemonic file
- ❗ Delete `mnemonic.txt` after restoring
- ❗ For personal wallet recovery only

---

## 📜 License

MIT License
