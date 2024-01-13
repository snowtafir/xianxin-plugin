import plugin from "../../../lib/plugins/plugin.js";
import xxCfg from "../model/xxCfg.js";
import fs from "node:fs";
import fetch from "node-fetch";
import Weibo from "../model/weibo.js";
import lodash from 'lodash'

let weiboSetFile = "./plugins/trss-xianxin-plugin/config/weibo.set.yaml";
if (!fs.existsSync(weiboSetFile)) {
  fs.copyFileSync(
    "./plugins/trss-xianxin-plugin/defSet/weibo/set.yaml",
    weiboSetFile
  );
}

let weiboPushFile = "./plugins/trss-xianxin-plugin/config/weibo.push.yaml";
if (!fs.existsSync(weiboPushFile)) {
  fs.copyFileSync(
    "./plugins/trss-xianxin-plugin/defSet/weibo/push.yaml",
    weiboPushFile
  );
}

export class weibo extends plugin {
  constructor() {
    super({
      name: "微博功能",
      dsc: "微博相关指令",
      event: "message",
      priority: 500,
      rule: [{
          reg: "^#*博主\\s*[0-9]*$",
          fnc: "detail",
          event: "message.group",
        },
        {
          reg: "^#*(添加|订阅|新增|增加)微博推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$",
          fnc: "addPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*(删除|取消|移除|去除)微博推送\\s*(视频\\s*|图文\\s*|文章\\s*|转发\\s*)*.*$",
          fnc: "delPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*推送(微博)?列表$",
          fnc: "listPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*搜索博主.*$",
          fnc: "searchup",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*手动推送微博$",
          fnc: "newPushTask",
          permission: "master",
          event: "message.group",
        },
        {
          reg: '^#*微博帮助$',
          event: 'message',
          fnc: 'weiboHelp'
        },
      ],
    });
    this.weiboSetData = xxCfg.getConfig("weibo", "set");
    this.weiboPushData = xxCfg.getConfig("weibo", "push");

    /** 定时任务 */
    this.task = {
      cron: !!this.weiboSetData.pushStatus ?
        this.weiboSetData.pushTime : "",
      name: "xianxin插件---微博推送定时任务",
      fnc: () => this.newPushTask(),
      log: !!this.weiboSetData.pushTaskLog,
    };
  }

  async newPushTask() {
    let weibo = new Weibo(this.e);
    await weibo.upTask();
  }

  /** 微博帮助 */
  async weiboHelp() {
    await this.reply(`★微博uid获取方法请查看仓库主页/找度娘叭~\n可获取uid的博主页示例链接：https：//m。weibo。cn/u/6593199887，\n其中6593199887即为博主uid`)
    return
  }

  /** 通过博主id获取博主详情 */
  async detail() {
    let target = this.e.msg.replace(/#*博主/g, "").trim();

    const Res = await new Weibo(this.e).get_bozhu_info(target);

    if (!Res) {
      this.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return true;
    }

    const userInfo = Res?.data?.userInfo || null;

    if (Res?.ok !== 1 || !userInfo) {
      this.reply("ID错误捏，请核对一下吧～");
      return true;
    }

    let sex = userInfo.gender === 'f' ? '女' : userInfo.gender === 'm' ? '男' : '未知';

    const message = [
      `-------微博-------`,
      `\n博主昵称：${userInfo.screen_name || ''}`,
      `\nUID：${userInfo.id || target}`,
      `\n性别：${sex}`,
      `\n微博认证：${userInfo.verified_reason || '未认证'}`,
      `\n描述：${userInfo.description || ''}`,
      `\nsvip等级：${userInfo.svip || ''}`,
      `\nvip等级：${userInfo.mbrank || ''}`,
      `\n关注：${userInfo.follow_count || ''}`,
      `\n粉丝人数：${userInfo.followers_count_str || ''}`,
    ];

    this.reply(message);
  }

  /** 添加微博推送 */
  async addPush() {
    let uid = this.e.msg
      .replace(
        /#*(添加|订阅|新增|增加)微博推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g,
        ""
      )
      .trim();

    if (!uid) {
      this.e.reply(
        `请输入正确的博主id叭，命令示例：#订阅微博推送6593199887`
      );
      return true;
    }

    let data = this.weiboPushData || {};

    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    const upData = data[this.e.group_id].find((item) => item.uid == uid);

    if (upData) {
      data[this.e.group_id].map((item) => {
        if (item.uid == uid) {
          item.type = this.typeHandle(item, this.e.msg, "add");
        }
        return item;
      });

      this.weiboPushData = data;
      xxCfg.saveSet("weibo", "push", "config", data);
      this.e.reply(`修改微博推送动态类型成功~\n${upData.name}：${uid}`);
      return;
    }

    const res = await new Weibo(this.e).get_bozhu_info(uid);

    if (!res) {
      this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return;
    }

    if (res.ok !== 1 || !(res.data || null)) {
      this.e.reply(
        "博主id错误耶\n使用示例1(订阅全部动态)：#订阅微博推送6593199887\n示例2(订阅转发、图文、文字、视频动态)：#订阅微博推送图文6593199887"
      );
      return true;
    }

    const userInfo = res.data.userInfo || [];

    let name = uid;

    if (userInfo && (userInfo.length !== 0)) {
      name = userInfo.screen_name || uid;
    }

    data[this.e.group_id].push({
      uid,
      name: name,
      type: this.typeHandle({
          uid,
          name,
        },
        this.e.msg,
        "add"
      ),
    });

    this.weiboPushData = data;

    xxCfg.saveSet("weibo", "push", "config", data);

    this.e.reply(`好耶~添加微博推送成功~\n${name}：${uid}`);
  }


  /** 删除微博推送 */
  async delPush() {
    let uid = this.e.msg
      .replace(
        /#*(删除|取消|移除|去除)微博推送\s*(视频\s*|图文\s*|文章\s*|转发\s*)*/g,
        ""
      )
      .trim();
    if (!uid) {
      this.e.reply(
        `请输入推送的博主id啦\n使用示例1(订阅全部动态)：#取消微博推送6593199887\n示例2(订阅转发、图文、文章、视频动态)：#取消微博推送图文6593199887`
      );
      return;
    }
    let data = this.weiboPushData || {};

    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    const upData = data[this.e.group_id].find((item) => item.uid == uid);

    if (!upData) {
      this.e.reply(
        `唔，未找到订阅的该ID欸，请核实是否订阅了该ID的博主喔`
      );
      return;
    }

    const newType = this.typeHandle(upData, this.e.msg, "del");

    let isDel = false;

    if (newType.length) {
      data[this.e.group_id].map((item) => {
        if (item.uid == uid) {
          item.type = newType;
        }
        return item;
      });
    } else {
      isDel = true;
      data[this.e.group_id] = data[this.e.group_id].filter(
        (item) => item.uid !== uid
      );
    }

    this.bilibiliPushData = data;

    xxCfg.saveSet("weibo", "push", "config", data);

    this.e.reply(`${isDel ? "删除" : "修改"}b站推送成功~\n${uid}`);
  }

  /** 微博推送列表 */
  async listPush() {
    let data = this.weiboPushData || {};
    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    const messages = [];

    const typeMap = {
      DYNAMIC_TYPE_FORWARD: "转发",
      DYNAMIC_TYPE_AV: "视频",
      DYNAMIC_TYPE_DRAW: "图文",
      DYNAMIC_TYPE_ARTICLE: "文章",
    };

    data[this.e.group_id].map((item) => {
      const types = new Set();

      if (item.type && item.type.length) {
        item.type.map((typeItem) => {
          types.add(typeMap[typeItem]);
          return typeItem;
        });
      }

      messages.push(
        `${item.uid}  ${item.name}${types.size ? `[${Array.from(types).join("、")}]` : "[全部动态]"
        }`
      );
      return item;
    });

    this.e.reply(`推送列表如下：\n${messages.join("\n")}`);
  }

  /** 根据昵称搜索博主信息*/
  async searchup() {
    let keyword = this.e.msg.replace(/#*搜索博主/g, "").trim();

    const res = await new Weibo(this.e).search_bozhu_info(keyword);

    if (!res) {
      this.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return;
    }

    const info = res?.data?.user[0];
    const infos = res?.data?.users[0];
    const uid = res?.data?.user[0]?.uid;
    const id = res?.data?.users[0]?.id;
    const nick = res?.data?.user[0]?.nick;
    const screen_name = res?.data?.users[0]?.screen_name;
    const followers_count_str = res?.data?.users[0]?.followers_count_str;

    if (res.ok !== 0 && (!info || !infos)) {
      this.reply("惹~没有搜索到该用户捏，\n请换个关键词试试吧~ \nPS：该方法只能搜索到大V");
      return;
    }

    const messages = [];

    messages.push(
      `-----微博-----\n博主昵称：${nick || screen_name }\nUID：${uid || id}\n粉丝人数：${followers_count_str || ''}`
    );

    this.e.reply(messages.join("\n"));
  }

  /**推送类型设置 */
  typeHandle(up, msg, type) {
    let newType = new Set(up.type || []);
    if (type == "add") {

      if (msg.indexOf("转发") !== -1) {
        newType.add("DYNAMIC_TYPE_FORWARD");
      }
      if (msg.indexOf("文章") !== -1) {
        newType.add("DYNAMIC_TYPE_ARTICLE");
      }
      if (msg.indexOf("图文") !== -1) {
        newType.add("DYNAMIC_TYPE_DRAW");
        newType.add("DYNAMIC_TYPE_WORD");
      }
      if (msg.indexOf("视频") !== -1) {
        newType.add("DYNAMIC_TYPE_AV");
      }
    } else if (type == "del") {
      if (!newType.size) {
        newType = new Set([
          "DYNAMIC_TYPE_FORWARD",
          "DYNAMIC_TYPE_ARTICLE",
          "DYNAMIC_TYPE_DRAW",
          "DYNAMIC_TYPE_WORD",
          "DYNAMIC_TYPE_AV",
        ]);
      }

      let isDelType = false;

      if (msg.indexOf("转发") !== -1) {
        newType.delete("DYNAMIC_TYPE_FORWARD");
        isDelType = true;
      }
      if (msg.indexOf("文章") !== -1) {
        newType.delete("DYNAMIC_TYPE_ARTICLE");
        isDelType = true;
      }
      if (msg.indexOf("图文") !== -1) {
        newType.delete("DYNAMIC_TYPE_DRAW");
        newType.delete("DYNAMIC_TYPE_WORD");
        isDelType = true;
      }
      if (msg.indexOf("视频") !== -1) {
        newType.delete("DYNAMIC_TYPE_AV");
        isDelType = true;
      }
      if (!isDelType) {
        newType.clear();
      }
    }
    return Array.from(newType);
  }
}