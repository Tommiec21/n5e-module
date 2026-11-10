import { spawn } from "node:child_process";

// Keep a descendant active so cancellation checks exercise cleanup beyond the direct child.
spawn(process.execPath, ["-e", "setInterval(() => require('fs').appendFileSync(process.argv[1], 'x'), 25)", process.argv[2]], { stdio: "ignore", windowsHide: true });
setInterval(() => {}, 1000);
