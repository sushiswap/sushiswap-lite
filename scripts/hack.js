const fs = require("fs");

const hack = (file, from, to) => {
    const path = "./node_modules/" + file;
    const original = fs.readFileSync(path, {encoding: "utf8"})
    const hacked = original.replace(from, to);
    fs.writeFileSync(path, hacked);
    console.log("Hacked " + path);
}

hack("@ethersproject/providers/lib/websocket-provider.js", "require(\"ws\")", "require(\"react-native\").WebSocket");
