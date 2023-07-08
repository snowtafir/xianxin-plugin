import YAML from "yaml";
import fs from "node:fs";
import chokidar from "chokidar";
import lodash from "lodash";
import { promisify } from 'node:util';

/** 配置文件 直接借鉴yunzai配置代码 */
class XsCfg {
  constructor() {
    /** 默认设置 */
    this.defSetPath = "./plugins/xianxin-plugin/defSet/";
    this.defSet = {};

    /** 用户设置 */
    this.configPath = "./plugins/xianxin-plugin/config/";
    this.config = {};

    /** 监听文件 */
    this.watcher = { config: {}, defSet: {} };
  }

  /**
   * @param app  功能
   * @param name 配置文件名称
   */
  getdefSet(app, name) {
    return this.getYaml(app, name, "defSet");
  }

  /** 用户配置 */
  getConfig(app, name) {
    let ignore = [];

    if (ignore.includes(`${app}.${name}`)) {
      return this.getYaml(app, name, "config");
    }

    return {
      ...this.getdefSet(app, name),
      ...this.getYaml(app, name, "config"),
    };
  }

  /**
   * 获取配置yaml
   * @param app 功能
   * @param name 名称
   * @param type 默认跑配置-defSet，用户配置-config
   */
  getYaml(app, name, type) {
    let file = this.getFilePath(app, name, type);
    let key = `${app}.${name}`;

    if (this[type][key]) return this[type][key];

    this[type][key] = YAML.parse(fs.readFileSync(file, "utf8"));

    this.watch(file, app, name, type);

    return this[type][key];
  }

  getFilePath(app, name, type) {
    if (type == "defSet") return `${this.defSetPath}${app}/${name}.yaml`;
    else return `${this.configPath}${app}.${name}.yaml`;
  }

  /** 监听配置文件 */
  watch(file, app, name, type = "defSet") {
    let key = `${app}.${name}`;

    if (this.watcher[type][key]) return;

    const watcher = chokidar.watch(file);
    watcher.on("change", (path) => {
      delete this[type][key];
      logger.mark(`[修改配置文件][${type}][${app}][${name}]`);
      if (this[`change_${app}${name}`]) {
        this[`change_${app}${name}`]();
      }
    });

    this.watcher[type][key] = watcher;
  }

  saveSet(app, name, type, data) {
    let file = this.getFilePath(app, name, type);
    if (lodash.isEmpty(data)) {
      fs.existsSync(file) && fs.unlinkSync(file);
    } else {
      let yaml = YAML.stringify(data);
      fs.writeFileSync(file, yaml, "utf8");
    }
  }

  /** 读取绑定的B站ck */
  async getBiliCk() {
    let dir = `./data/BilibiliCookie/`
    let Bck = []
    let files = fs.readdirSync(dir).filter(file => file.endsWith('.yaml'))

    const readFile = promisify(fs.readFile)

    let promises = []

    files.forEach((v) => promises.push(readFile(`${dir}${v}`, 'utf8')))
    const res = await Promise.all(promises)
    res.forEach((v, index) => {
      let tmp = YAML.parse(v)
      Bck.push(tmp)
    })
    return Bck
  }

  /** 覆盖保存绑定的B站ck */
  async saveBiliCk(data) {
    let dir = `./data/BilibiliCookie/`
    let file = dir + `bili_Ck.yaml`
    let addData = data.replace(/\s/g, '').trim();
    if (lodash.isEmpty(addData)) {
      fs.existsSync(file) && fs.unlinkSync(file)
    } else {
      const absPath = dir;
      if (!absPath) {
        fs.mkdir(absPath); //Create dir in case not found
      }
      let yaml = YAML.stringify(addData);
      fs.writeFileSync(file, yaml, 'utf8')
    }
  }
}

export default new XsCfg();
