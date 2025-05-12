import readline from "readline";

async function promptPassword(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    (rl as any).stdoutMuted = true;

    rl.question("🔑 请输入密码：", (password: string) => {
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
export { promptPassword };
