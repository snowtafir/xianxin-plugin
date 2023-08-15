import plugin from "../../../lib/plugins/plugin.js";
import xxCfg from "../model/xxCfg.js";
import fs from "node:fs";
import fetch from "node-fetch";
import Bilibili from "../model/bilibili.js";
import lodash from 'lodash'

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
          reg: '^#*删除*(b|B)站临时(ck|CK|Ck|Ck|cookie)$',
          event: 'message',
          permission: "master",
          fnc: 'delTempBck'
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
      name: "xianxin插件---B站推送定时任务",
      fnc: () => this.newPushTask(),
      log: !!this.bilibiliSetData.pushTaskLog,
    };
  }

  async newPushTask() {
    let bilibili = new Bilibili(this.e);
    await bilibili.upTask();
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

      if ((!param.buvid3 || !param._uuid || !param.buvid4 || !param.b_nut) || !param.DedeUserID) {
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
        if (!param.b_nut || (param.b_nut).length === 0) {
          let _b_nut_ = 'b_nut';
          await this.e.reply(`B站cookie：当前缺失：\n${_b_nut_}`)
        }
        if (!param.DedeUserID || (param.DedeUserID).length === 0) {
          let DedeUserID_ = 'DedeUserID';
          await this.e.reply(`B站cookie：当前缺失：\n${DedeUserID_}`)
        }
        return
      }

      //var UID = param.DedeUserID
      /*this.Bck = `buvid3=${param.buvid3};buvid4=${param.buvid4};_uuid=${param._uuid}; rpdid=${param.rpdid}; fingerprint=${param.fingerprint};`*/

      xxCfg.saveBiliCk(Bck)

      logger.mark(`${this.e.logFnc} 保存B站cookie成功 [UID:${param.DedeUserID}]`)

      let uidMsg = [`好耶~绑定B站cookie成功：\n${param.DedeUserID}`]

      await this.e.reply(uidMsg)
    }
  }

  /** 删除绑定的B站ck */
  async delMyBCk() {
    let Bck = ''
    xxCfg.saveBiliCk(Bck)
    await this.e.reply(`绑定的B站ck已删除`)

  }

  /** 我的B站ck */
  async myBCk() {
    if (this.e.isGroup) {
      await this.reply('请私聊查看叭')
      return
    } else {
      const ck = await xxCfg.getBiliCk();
      if (ck && ck.length == 0) {
        this.e.reply(
          `惹~当前尚未配置B站ck`
        );
      } else {
        this.e.reply(
          `芜湖~当前配置的B站ck为：${ck}`
        );
      }
    }
  }

  /** B站ck帮助 */
  async BCkHelp() {
    await this.reply(`★B站ck获取方法请查看仓库主页/找度娘叭~\n\n★如果出现总是推送失败以及失败后执行:\n#删除b站临时ck\n后仍失败的，\n\n请绑定自己的B站ck,\n务必包含以下字段的相等式内容： \n\nbuvid3 \nbuvid4 \n_uuid  \nb_nut \nDedeUserID\n\n★风险选项：\n推送总失败，权宜之计可考虑绑定cookie时添加/保留 \nSESSDATA=xxxxxx;\n该选项如果使用自己真实的SESSDATA有封号的可能性\n特别是群人数多/推送订阅多的慎用！！\n\n☆目前可用解决方法：\n把获取的真实\nSESSDATA=xxxxxx;\n保留相同长度随机修改其中的值\n例如SESSDATA=xxyt8490vnw00invsejfyyfsid;\n然后添加到要绑定的cookie后面\n或者替换要绑定的cookie里原有的SESSDATA即可。`)
    return
  }

  /** 删除redis缓存的临时B站ck */
  async delTempBck() {
    let ckKey = "Yz:xianxin:bilibili:biliTempCookie";
    redis.set(ckKey, '', { EX: 3600 * 24 * 30 })
    this.e.reply(`~当前xianxin-plugin自动获取的临时b站ck已删除~`);
  }

  /** 添加b站推送 */
  async addPush() {
    let uid = this.e.msg
      .replace(
        /#*(添加|订阅|新增|增加)up推送\s*(直播\s*|视频\s*|图文\s*|文章\s*|转发\s*|直播\s*)*/g,
        ""
      )
      .trim();
    // (直播\\s*|视频\\s*|图文\\s*|文章\\s*|转发\\s*|直播\\s*)*


    if (!uid) {
      this.e.reply(
        `请输入正确的推送的uid叭\n示例1(订阅全部动态)：#订阅up推送 401742377\n示例2(订阅直播动态)：#订阅up推送 直播 401742377\n示例3(订阅直播、转发、图文、文章、视频动态)：#订阅up推送 直播 转发 图文 文章 视频 401742377`
      );
      return true;
    }

    let data = this.bilibiliPushData || {};

    if (!data[this.e.group_id]) data[this.e.group_id] = new Array();

    // const existUids = data[this.e.group_id].map((item) => item.uid || "");

    const upData = data[this.e.group_id].find((item) => item.uid == uid);

    if (upData) {
      data[this.e.group_id].map((item) => {
        if (item.uid == uid) {
          item.type = this.typeHandle(item, this.e.msg, "add");
        }
        return item;
      });

      this.bilibiliPushData = data;
      xxCfg.saveSet("bilibili", "push", "config", data);
      this.e.reply(`修改b站推送动态类型成功~\n${upData.name}：${uid}`);
      return;
    }

    // const res = await new Bilibili(this.e).getBilibiliUserInfo(uid);

    const res = await new Bilibili(this.e).getBilibiliDynamicInfo(uid);

    if (!res) {
      this.e.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return;
    }
    const resJson = res;
    //const resJson = await res.json();

    /* 用于debug的代码段
    const ck = await xxCfg.getBiliCk()
    this.e.reply(
      `当前绑定的B站ck为：${ck}`
    );
    */

    if (resJson.code != 0 || !resJson?.data) {
      this.e.reply(
        "uid错误或绑定的B站ck失效了耶\n示例1(订阅全部动态)：#订阅up推送 401742377\n示例2(订阅直播动态)：#订阅up推送 直播 401742377\n示例3(订阅直播、转发、图文、文章、视频动态)：#订阅up推送 直播 转发 图文 文章 视频 401742377"
      );
      return true;
    }

    const dynamics = resJson?.data?.items || [];

    let name = uid;

    if (dynamics.length) {
      let dynamic = dynamics[0];
      name = dynamic?.modules?.module_author?.name || uid;
    }

    data[this.e.group_id].push({
      uid,
      name: name,
      type: this.typeHandle(
        {
          uid,
          name,
        },
        this.e.msg,
        "add"
      ),
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
        `唔，未找到该uid欸，请核实是否输入指令正确喔\n示例1(取消全部动态推送)：#取消up推送 401742377\n示例2(取消订阅直播动态)：#取消up推送 直播 401742377\n示例3(取消订阅直播、转发、图文、文章、视频动态)：#取消up推送 直播 转发 图文 文章 视频 401742377`
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

    const accInfoRes = await new Bilibili(this.e).getBilibiliUserInfoDetail(
      uid
    );

    if (!accInfoRes.ok) {
      this.reply("诶嘿，出了点网络问题，等会再试试吧~");
      return true;
    }

    const accInfoResJsonData = await accInfoRes.json();

    const data = accInfoResJsonData?.data || null;

    if (accInfoResJsonData.code != 0 || !data) {
      this.reply("UID不对啊老兄，别乱搞哦～");
      return true;
    }
    const message = [
      `昵称：${data.card.name}`,
      `\n性别：${data.card.sex}`,
      `\n等级：${data.card.level_info.current_level}`,
      `\n粉丝人数：${data.card.fans}`,
    ];

    if (data.live) {
      message.push(
        `\n\n直播信息`,
        `\n直播标题：${data.live.title}`,
        `\n直播状态：${data.live.liveStatus ? "直播中" : "未开播"}`,
        `\n直播链接：${data.live.url}`
      );
      // if (data.live_room.watched_show) {
      //   message.push(`\n观看人数：${data.live_room.watched_show.num}人`);
      // }
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
      this.reply("没有搜索到该用户，请换个关键词试试吧");
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
