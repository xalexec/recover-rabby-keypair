import fs from "fs";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

const raw = JSON.parse(
  fs.readFileSync(`${process.env.HOME}/.config/solana/id.json`, "utf8")
);
const secretKey = Uint8Array.from(raw);

const keypair = Keypair.fromSecretKey(secretKey);
console.log("🔑 Private Key (base58):", bs58.encode(keypair.secretKey));
console.log("📬 Public Key:", keypair.publicKey.toBase58());
