import lodash from 'lodash';
import fs from "node:fs";
import plugin from "../../../lib/plugins/plugin.js";
import { Restart } from "../../other/restart.js";
import Bilibili from "../model/bilibili.js";
import xxCfg from "../model/xxCfg.js";
import { BILIBILI_HEADERS, applyQRCode, checkLogin, getNewTempCk, get_buvid_fp, pollQRCode, postExClimbWuzhi, readSavedCookieItems, readTempCk, saveLocalBiliCk, saveLoginCK, synCookie } from "../util/BiliApi.js";

let bilibiliSetFile = "./plugins/trss-xianxin-plugin/config/bilibili.set.yaml";
if (!fs.existsSync(bilibiliSetFile)) {
  fs.copyFileSync(
    "./plugins/trss-xianxin-plugin/defSet/bilibili/set.yaml",
    bilibiliSetFile
  );
}

let bilibiliPushFile = "./plugins/trss-xianxin-plugin/config/bilibili.push.yaml";
if (!fs.existsSync(bilibiliPushFile)) {
  fs.copyFileSync(
    "./plugins/trss-xianxin-plugin/defSet/bilibili/push.yaml",
    bilibiliPushFile
  );
}

export class bilibili extends plugin {
  constructor() {
    super({
      name: "B站功能",
      dsc: "b站相关指令",
      event: "message",
      priority: 500,
      rule: [
        {
          reg: "^#*up\\s*[0-9]*$",
          fnc: "detail",
          event: "message.group",
        },
        {
          reg: "^#*(添加|订阅|新增|增加)up推送\\s*(直播\\s*|视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$",
          fnc: "addPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*(删除|取消|移除|去除)up推送\\s*(直播\\s*|视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*.*$",
          fnc: "delPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*推送(up)?列表$",
          fnc: "listPush",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*搜索up.*$",
          fnc: "searchup",
          permission: "master",
          event: "message.group",
        },
        {
          reg: "^#*手动推送up$",
          fnc: "newPushTask",
          permission: "master",
          event: "message.group",
        },
        {
          reg: '^#扫码(B|b)站登录$',
          fnc: "BiliLogin",
          event: 'message'
        },
        {
          reg: '^#*我的*(b|B)站登录$',
          event: 'message',
          permission: "master",
          fnc: 'myLogin'
        },
        {
          reg: "^#*绑定*(b|B)站(ck|CK|cK|Ck)*(:|：)*.*$",
          fnc: "bingBiliCk",
          permission: "master",
          event: 'message'
        },
        {
          reg: '^#*我的*(b|B)站(ck|CK|Ck|Ck|cookie)$',
          event: 'message',
          permission: "master",
          fnc: 'myBCk'
        },
        {
          reg: '^#*(b|B)站(ck|CK|Ck|Ck|cookie)帮助$',
          event: 'message',
          fnc: 'BCkHelp'
        },
        {
          reg: '^#*删除*(b|B)站(ck|CK|Ck|Ck|cookie)$',
          event: 'message',
          permission: "master",
          fnc: 'delMyBCk'
        },
        {
          reg: '^#删除(b|B)站登录$',
          event: 'message',
          permission: "master",
          fnc: 'delLoginBCk'
        },
        {
          reg: '^#*刷新*(b|B)站临时(ck|CK|Ck|Ck|cookie)$',
          event: 'message',
          permission: "master",
          fnc: 'reflashTempBck'
        },
      ],
    });
    this.bilibiliSetData = xxCfg.getConfig("bilibili", "set");
    this.bilibiliPushData = xxCfg.getConfig("bilibili", "push");

    /** 定时任务 */
    this.task = {
      cron: !!this.bilibiliSetData.pushStatus
        ? this.bilibiliSetData.pushTime
        : "",
      name: "trss-xianxin插件---B站推送定时任务",
      fnc: () => this.newPushTask(),
      log: !!this.bilibiliSetData.pushTaskLog,
    };
  }

  async newPushTask() {
    let bilibili = new Bilibili(this.e);
    await bilibili.upTask();
  }

  /**B站扫码登陆获取登陆ck */
  async BiliLogin() {
    if (this.e.isMaster) {
      try {
        const token = await applyQRCode(this.e);

        let biliLoginCk = await pollQRCode(this.e, token);

        //let _uuid = readSavedCookieItems(biliLoginCk, ['_uuid'])

        //const buvid_fp = await get_buvid_fp(_uuid);

        //biliLoginCk = buvid_fp + biliLoginCk;

        if (lodash.trim(biliLoginCk).length != 0) {
          await saveLoginCK(this.e, biliLoginCk);
          this.e.reply(`get bilibili LoginCk：成功！`)
          const result = await postExClimbWuzhi(biliLoginCk); //激活ck

          const data = await result.json(); // 解析校验结果
          const dataCode = data.code; // 获取校验结果的 code
          if (dataCode !== 0) {
            (logger ?? Bot.logger)?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验失败：${JSON.stringify(data)}`); // 记录校验失败的日志
          } else if (dataCode === 0) {
            (logger ?? Bot.logger)?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验成功：${JSON.stringify(data)}`); // 记录校验成功的日志
          }
        } else {
          this.e.reply(`get bilibili LoginCk：失败X﹏X`)
        }
      } catch (Error) {
        (logger ?? Bot.logger)?.info(`trss-xianxin-plugin Login bilibili Failed：${Error}`);
      }
    } else {
      this.e.reply("未取得bot主人身份，无权限配置B站登录ck");
    }
  }

  /**验证B站登录 */
  async myLogin() {
    await checkLogin(this.e);
  }

  /** 绑定B站ck */
  async bingBiliCk() {
    if (this.e.isGroup) {
      await this.reply('密钥要泄露了惹，请撤回，并私聊绑定！')
      return
    } else {
      let Bck = this.e.msg
        .replace(/#|"*(添加|绑定|新增|增加)*(b|B)站*(ck|CK|cK|Ck)*(:|：)/g, "")
        .trim();

      let param = {}
      Bck.split(';').forEach((v) => {
        // 处理分割特殊cookie_token
        let tmp = lodash.trim(v).replace('=', '$').split('$')
        param[tmp[0]] = tmp[1]
      })

      if ((!param.buvid3 || !param._uuid || !param.buvid4) || !param.DedeUserID) {
        await this.e.reply('诶呀~发送cookie不完整\n请获取完整cookie进行绑定\nB站cookie的获取方法查看仓库主页或者百度一下');

        if (!param.buvid3 || (param.buvid3).length === 0) {
          let buvid3_ = 'buvid3';
          await this.e.reply(`B站cookie：当前缺失：\n${buvid3_}`)
        }
        if (!param.buvid4 || (param.buvid4).length === 0) {
          let buvid4_ = 'buvid4';
          await this.e.reply(`B站cookie：当前缺失：\n${buvid4_}`)
        }
        if (!param._uuid || (param._uuid).length === 0) {
          let _uuid_ = '_uuid';
          await this.e.reply(`B站cookie：当前缺失：\n${_uuid_}`)
        }
        if (!param.DedeUserID || (param.DedeUserID).length === 0) {
          let DedeUserID_ = 'DedeUserID';
          await this.e.reply(`B站cookie：当前缺失：\n${DedeUserID_}`)
        }
        return
      }

      //筛选ck
      Bck = readSavedCookieItems(Bck, ['buvid3', 'buvid4', '_uuid', 'SESSDATA', 'DedeUserID', 'DedeUserID__ckMd5', 'bili_jct', 'b_nut', 'b_lsid'])

      //const buvid_fp = await get_buvid_fp(param._uuid)

      //Bck = buvid_fp + Bck; //添加buvid_fp值

      await saveLocalBiliCk(Bck);

      logger.mark(`${this.e.logFnc} 保存B站cookie成功 [UID:${param.DedeUserID}]`)

      let uidMsg = [`好耶~绑定B站cookie成功：\n${param.DedeUserID}`]

      await this.e.reply(uidMsg);

      const result = await postExClimbWuzhi(Bck); //激活ck

      const data = await result.json(); // 解析校验结果
      const dataCode = data.code; // 获取校验结果的 code
      if (dataCode !== 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验失败：${JSON.stringify(data)}`); // 记录校验失败的日志
      } else if (dataCode === 0) {
        (logger ?? Bot.logger)?.mark(`trss-xianxin插件：获取tempCK，B站ExC接口校验成功：${JSON.stringify(data)}`); // 记录校验成功的日志
      }
    }
  }

  /** 删除绑定的B站ck */
  async delMyBCk() {
    let Bck = ''
    await saveLocalBiliCk(Bck)
    await this.e.reply(`手动绑定的B站ck已删除~`)
  }

  /** 删除登陆的B站ck */
  async delLoginBCk() {
    const LoginCkKey = "Yz:xianxin:bilibili:biliLoginCookie";
    let loginCK = "";
    redis.set(LoginCkKey, loginCK, { EX: 3600 * 24 * 180 });
    this.e.reply(`二维码登陆B站的ck已删除~`);
  }

  /** 我的B站ck */
  async myBCk() {
    if (this.e.isGroup) {
      await this.reply('请私聊查看叭')
      return
    } else {
      let { cookie, mark } = await synCookie();
      if (mark === "localCk") {
        this.e.reply(`当前使用自定义的B站cookie：`);
        this.e.reply(`${cookie}`);
      } else if (mark === "loginCk") {
        this.e.reply(`当前使用扫码登录的B站cookie：`);
        this.e.reply(`${cookie}`);
      } else if (mark === "tempCk") {
        this.e.reply(`当前使用临时B站cookie：`);
        this.e.reply(`${cookie}`);
      } else if (mark == 'ckIsEmpty') {
        this.e.reply(`当前无可使用的B站cookie。`)
      }
    }
  }

  /** B站ck帮助 */
  async BCkHelp() {
    await this.reply(`★B站动态功能必要配置详情看仓库主页叭~\n\n★摘要:\n1.#扫码登录B站 推荐\n2.#刷新B站临时ck 大概率风控1次/2天\n3.配置文件增加动态监测时长\n4.运行bot的设备或局域网内的设备挂机登录账号的B站客户端\n5.手动配置自定义ck：#绑定B站ck: xxx`)
    return
  }

  /**重启bot*/
  restart() {
    new Restart(this.e).restart();
  }

  /** 删除redis缓存的临时B站ck */
  async reflashTempBck() {
    try {
      await getNewTempCk();
      let newTempCk = await readTempCk();
      if ((newTempCk !== null) && (newTempCk !== undefined) && (newTempCk.length !== 0) && (newTempCk !== '')) {

        this.e.reply(`~trss-xianxin-plugin:\n临时b站ck刷新成功~❤~\n接下来如果获取动态失败，请重启bot(手动或发送指令 #重启)刷新状态~`);

        await new Promise(() => setTimeout(() => this.restart(), 5000));
      } else {
        this.e.reply(`~trss-xianxin-plugin:\n临时b站ck刷新失败X﹏X\n请重启bot(手动或发送指令 #重启)后重试`);
      }
    } catch (error) {
      this.e.reply(`~trss-xianxin-plugin:\n临时b站ck接口刷新失败X﹏X\n请重启bot(手动或发送指令 #重启)后重试`);
      (logger ?? Bot.logger)?.mark(`trss-xianxin插件：B站临时ck刷新error：${error}`);
    }
  }

  /**通过uid订阅对应用户的b站动态 */
  async addPush() {
    let uid = this.e.msg.replace(/#*(添加|订阅|新增|增加)up推送\s*(直播\s*|视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g, "").trim();

    if (!uid) {
      this.e.reply(`请输入正确的推送的uid叭\n示例1(订阅全部动态)：#订阅up推送 401742377\n示例2(订阅直播动态)：#订阅up推送 直播 401742377\n示例3(订阅直播、转发、图文、文章、视频动态)：#订阅up推送 直播 转发 图文 文章 视频 401742377`);
      return true;
    }

    let data = this.bilibiliPushData || {};

    if (!data[this.e.group_id]) {
      data[this.e.group_id] = [];
    }

    const upData = data[this.e.group_id].find((item) => item.uid === uid);

    if (upData) {
      data[this.e.group_id].forEach((item) => {
        if (item.uid === uid) {
          item.type = this.typeHandle(item, this.e.msg, "add");
        }
      });

      this.bilibiliPushData = data;
      xxCfg.saveSet("bilibili", "push", "config", data);
      this.e.reply(`修改b站推送动态类型成功~\n${upData.name}：${uid}`);
      return;
    }

    const res = await new Bilibili(this.e).getBilibiliDynamicInfoNew(uid);

    if (!res) {
      this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return;
    }

    if (!res.data || res.code !== 0) {
      this.e.reply(`订阅失败了耶~\n${uid}可能是无效的UID或遭遇了风控，请稍后再试~`);
      return true;
    }

    let dynamics = res.data.items || [];
    let name = dynamics.length ? (dynamics[0].modules.module_author?.name || uid) : uid;

    data[this.e.group_id].push({
      e_self_id: this.e.self_id,
      uid,
      name,
      type: this.typeHandle({ uid, name }, this.e.msg, "add"),
    });

    this.bilibiliPushData = data;
    xxCfg.saveSet("bilibili", "push", "config", data);
    this.e.reply(`好耶~添加b站推送成功~\n${name}：${uid}`);
  }


  /** 删除b站推送 */
  async delPush() {
    let uid = this.e.msg
      .replace(
        /#*(删除|取消|移除|去除)up推送\s*(直播\s*|视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g,
        ""
      )
      .trim();
    if (!uid) {
      this.e.reply(
        `请输入推送的uid啦\n示例1(取消全部动态推送)：#取消up推送 401742377\n示例2(取消订阅直播动态)：#取消up推送 直播 401742377\n示例3(取消订阅直播、转发、图文、文章、视频动态)：#取消up推送 直播 转发 图文 文章 视频 401742377`
      );
      return;
    }
    let data = this.bilibiliPushData || {};

    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    const upData = data[this.e.group_id].find((item) => item.uid == uid);

    if (!upData) {
      this.e.reply(
        `唔，推送列表中未找到该uid欸，请核实是否输入指令正确喔\n示例1(取消全部动态推送)：#取消up推送 401742377\n示例2(取消订阅直播动态)：#取消up推送 直播 401742377\n示例3(取消订阅直播、转发、图文、文章、视频动态)：#取消up推送 直播 转发 图文 文章 视频 401742377`
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

    xxCfg.saveSet("bilibili", "push", "config", data);

    this.e.reply(`${isDel ? "删除" : "修改"}b站推送成功~\n${uid}`);
  }

  /** b站推送列表 */
  async listPush() {
    let data = this.bilibiliPushData || {};
    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    const messages = [];

    const typeMap = {
      DYNAMIC_TYPE_AV: "视频",
      DYNAMIC_TYPE_WORD: "图文",
      DYNAMIC_TYPE_DRAW: "图文",
      DYNAMIC_TYPE_ARTICLE: "文章",
      DYNAMIC_TYPE_FORWARD: "转发",
      DYNAMIC_TYPE_LIVE_RCMD: "直播",
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

  async detail() {
    let uid = this.e.msg.replace(/#*up/g, "").trim();

    const accInfoRes = await new Bilibili(this.e).getBilibiliUserInfo(uid);

    if (!accInfoRes.ok) {
      this.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return true;
    }

    const accInfoResJsonData = await accInfoRes.json();

    const data = accInfoResJsonData.data || null;

    if (accInfoResJsonData.code == -799) {
      this.reply("遭遇风控：请求过于频繁，请稍后再试。");
      return true;
    } else if (accInfoResJsonData.code != 0 || !data) {
      this.reply("UID不对或遭遇风控，获取失败");
      return true;
    }
    const message = [
      `昵称：${data?.name}`,
      `\n性别：${data?.sex}`,
      `\n等级：${data?.level}`,
      //`\n粉丝人数：${data?.card?.fans}`,
    ];

    if (data.live_room) {
      message.push(
        `\n***********\n---直播信息---`,
        `\n直播标题：${data?.live_room?.title}`,
        `\n直播房间：${data?.live_room?.roomid}`,
        `\n直播状态：${data?.live_room?.liveStatus ? "直播中" : "未开播"}`,
        `\n直播链接：${data?.live_room?.url}`,
        `\n观看人数：${data?.live_room?.watched_show?.num}人`
      );
    }

    this.reply(message);
  }

  /**
   * rule - 根据名称搜索up信息
   */
  async searchup() {
    let keyword = this.e.msg.replace(/#*搜索up/g, "").trim();

    let response = await new Bilibili(this.e).getBilibiliUp(keyword);
    if (!response.ok) {
      this.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return;
    }

    const res = await response.json();

    if (res.code !== 0 || !res.data.result || !res.data.result.length) {
      this.reply("哦豁~没有搜索到该用户捏，请换个关键词试试吧~");
      return;
    }

    const messages = [];

    res.data.result.map((item, index) => {
      if (index < 5) {
        messages.push(
          `${item.uname}\nUID：${item.mid}\n粉丝数：${item.fans}${index < 4 ? "\n" : ""
          }`
        );
      }
      return item;
    });

    this.e.reply(messages.join("\n"));
  }

  typeHandle(up, msg, type) {
    let newType = new Set(up.type || []);
    if (type == "add") {
      if (msg.indexOf("直播") !== -1) {
        newType.add("DYNAMIC_TYPE_LIVE_RCMD");
      }
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
          "DYNAMIC_TYPE_LIVE_RCMD",
          "DYNAMIC_TYPE_FORWARD",
          "DYNAMIC_TYPE_ARTICLE",
          "DYNAMIC_TYPE_DRAW",
          "DYNAMIC_TYPE_WORD",
          "DYNAMIC_TYPE_AV",
        ]);
      }

      let isDelType = false;

      if (msg.indexOf("直播") !== -1) {
        newType.delete("DYNAMIC_TYPE_LIVE_RCMD");
        isDelType = true;
      }
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
