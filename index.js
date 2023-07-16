import fs from "node:fs";
import xxCfg from "./model/xxCfg.js";

if (!global.segment) {
  try {
    global.segment = (await import("oicq")).segment;
  } catch (err) {
    global.segment = (await import("icqq")).segment;
  }
}

const versionData = xxCfg.getdefSet("version", "version");

logger.info(`--------------------------`);
logger.info(`适配trss版 闲心插件 ${versionData[0].version} 初始化~`);
logger.info(`仓库地址：https://gitee.com/snowtafir/xianxin-plugin`);
logger.info(`trss版维护者：杉星雪/snowtafir`);
logger.info(`原作者：@闲心/xianxincoder`);
logger.info(`--------------------------`);

const files = fs
  .readdirSync("./plugins/trss-xianxin-plugin/apps")
  .filter((file) => file.endsWith(".js"));

let ret = [];

files.forEach((file) => {
  ret.push(import(`./apps/${file}`));
});

ret = await Promise.allSettled(ret);

let apps = {};
for (let i in files) {
  let name = files[i].replace(".js", "");

  if (ret[i].status != "fulfilled") {
    logger.error(`载入插件错误：${logger.red(name)}`);
    logger.error(ret[i].reason);
    continue;
  }
  apps[name] = ret[i].value[Object.keys(ret[i].value)[0]];
}
export { apps };
