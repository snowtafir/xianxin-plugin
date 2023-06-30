import moment from "moment";
import xxCfg from "../model/xxCfg.js";
import base from "./base.js";
import puppeteer from "../../../lib/puppeteer/puppeteer.js";
import fetch from "node-fetch";
import common from "../../../lib/common/common.js";
import md5 from 'md5'

//重排码
const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]
class Bili_Wbi {
  static temporaryCookie = null;
  static cookieTimeStamp = -1;
  // 获取最新的 img_key 和 sub_key
  static async getWbiKeys() {
    const url = 'https://api.bilibili.com/x/web-interface/nav';
    const resp = await fetch(url);
    const json_content = await resp.json();
    const img_url = json_content.data.wbi_img.img_url;
    const sub_url = json_content.data.wbi_img.sub_url;
    return {
      img_key: img_url.substring(img_url.lastIndexOf('/') + 1, img_url.length).split('.')[0],
      sub_key: sub_url.substring(sub_url.lastIndexOf('/') + 1, sub_url.length).split('.')[0]
    }
  }

  // 对 imgKey 和 subKey 进行字符顺序打乱编码
  static getMixinKey(orig) {
    let temp = ''
    mixinKeyEncTab.forEach((n) => {
      temp += orig[n]
    })
    return temp.slice(0, 32)
  }

  // 为请求参数进行 wbi 签名的方法
  static encWbi(params, img_key, sub_key) {
    const mixin_key = this.getMixinKey(img_key + sub_key),
      curr_time = Math.round(Date.now() / 1000),
      chr_filter = /[!'\(\)*]/g
    let query = []
    params = Object.assign(params, { wts: curr_time })    // 添加 wts 字段
    // 按照 key 重排参数
    Object.keys(params).sort().forEach((key) => {
      query.push(
        encodeURIComponent(key) +
        '=' +
        // 过滤 value 中的 "!'()*" 字符
        encodeURIComponent(('' + params[key]).replace(chr_filter, ''))
      )
    })
    query = query.join('&')
    const wbi_sign = md5(query + mixin_key) // 计算 w_rid
    return query + '&w_rid=' + wbi_sign
  }

  /** 对实际请求参数进行 wbi 签名 */
  static async wbi_Code() {
    let params = {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Microsoft Edge";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": 1,
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36 Edg/105.0.1343.50",
      }
    };

    /**缓存获取的 img_key 和 sub_key到redis并设置过期时间 30分钟 && 执行 wbi签名*/
    this.key = "Yz:xianxin:bilibili:Wbi_Nav_Keys";
    try {
      let wbi_keys = JSON.parse(await redis.get(`${this.key}`));
      /** 执行 wbi签名*/
      this.encWbi(
        params,
        wbi_keys.img_key,
        wbi_keys.sub_key
      );
      /*Bot.logger.mark("xianxin插件：B站接口 wbi_keys读取成功");*/
    } catch (e) {
      Bot.logger.mark("xianxin插件：正在更新wbi_keys");
      let wbi_keys = await this.getWbiKeys();
      let wbikeys = wbi_keys;
      let wbi = JSON.stringify(wbi_keys)
      redis.set(`${this.key}`, `${wbi}`, { EX: 1800 });
      /** 执行 wbi签名*/
      this.encWbi(
        params,
        wbikeys.img_key,
        wbikeys.sub_key
      );
      Bot.logger.mark("xianxin插件：B站接口 更新wbi_keys成功");
    };
  }
  /**获取临时cookie*/
  static async refreshTemporaryCookie() {
    const url = 'https://www.bilibili.com/';
    const response = await fetch(url,
      {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua":
            '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": 1,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
      });

    this.temporaryCookie = response.headers.get['set-cookie'];
  }
  static async getTempCookie() {
    const permanentCookie = await xxCfg.getBiliCk();;
    if (permanentCookie) {
      return permanentCookie;
    } else {
      logger.mark('CustomCookie is Null');
    }
    const date = new Date();
    if (!this.temporaryCookie || date.getDate() != this.cookieTimeStamp) {
      await this.refreshTemporaryCookie();
      this.cookieTimeStamp = date.getDate();
    }
    return this.temporaryCookie;
  }
}

export default class Bilibili extends base {
  constructor(e) {
    super(e);
    this.model = "bilibili";
  }
  async getBilibiliDetail(uid) {
    let url = `https://api.bilibili.com/x/relation/stat?vmid=${uid}`;
    let Bck = await Bili_Wbi.getTempCookie();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
        cookie: Bck,
        pragma: "no-cache",
        "sec-ch-ua":
          '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": 1,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
    return response;
  }

  async getBilibiliUserInfo(uid) {
    try {
      let wrid = await Bili_Wbi.wbi_Code();
      let url = `https://api.bilibili.com/x/space/acc/info?mid=${uid}&${wrid}jsonp=jsonp`;
      let Bck = await Bili_Wbi.getTempCookie();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          cookie: Bck,
          pragma: "no-cache",
          "sec-ch-ua":
            '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": 1,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });
      return response;
    } catch (e) {
      Bot.logger.mark("xianxin插件：B站up信息请求失败");
      return;
    }
  }

  async getBilibiliUserInfoDetail(uid) {
    try {
      let wrid = await Bili_Wbi.wbi_Code();
      let url = `https://api.obfs.dev/api/bilibili/v3/user_info?uid=${uid}&${wrid}`;
      let Bck = await Bili_Wbi.getTempCookie();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          cookie: Bck,
          pragma: "no-cache",
          "sec-ch-ua":
            '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": 1,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });
      return response;
    } catch (e) {
      Bot.logger.mark("xianxin插件：B站up详情请求失败");
      return;
    }
  }

  async getBilibiliDynamicInfo(uid) {
    try {
      let wrid = await Bili_Wbi.wbi_Code();
      let url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/space?host_mid=${uid}&${wrid}`;
      let Bck = await Bili_Wbi.getTempCookie();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "cache-control": "no-cache",
          cookie: Bck,
          pragma: "no-cache",
          "sec-ch-ua":
            '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": 1,
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });
      return response;
    } catch (e) {
      Bot.logger.mark("xianxin插件：B站up动态请求失败");
      return;
    }
  }

  async getBilibiliUp(keyword) {
    let url = `https://api.bilibili.com/x/web-interface/search/type?keyword=${keyword}&page=1&search_type=bili_user&order=totalrank&pagesize=5`;
    let Bck = await Bili_Wbi.getTempCookie();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        authority: "api.bilibili.com",
        cookie: Bck,
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua":
          '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": 1,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
      redirect: "follow",
    });
    return response;
  }

  async upTask() {
    let setData = xxCfg.getConfig("bilibili", "set");
    let pushData = xxCfg.getConfig("bilibili", "push");

    // 推送2小时内的B站动态
    let interval = 7200;

    // 存放直播状态信息
    let lastLiveStatusInfo = {};

    let lastTemp = await redis.get("xianxin:bililive:lastlivestatus");

    if (lastTemp) {
      lastLiveStatusInfo = JSON.parse(lastTemp);
    }

    const uidMap = new Map();

    // 存放获取的所有动态 key为uid value为数组
    const dynamicList = {};
    for (let key in pushData) {
      const ups = pushData[key] || [];
      for (let up of ups) {
        if (!lastTemp) {
          lastLiveStatusInfo[`${up.uid}`] = 0;
        }

        const response = await this.getBilibiliDynamicInfo(up.uid);

        if (response) {
          const res = await response.json();
          if (res.code == 0) {
            const dynamicData = res?.data?.items || [];
            dynamicList[up.uid] = dynamicData;
          }
        }
        uidMap.set(up.uid, {
          groupIds: Array.from(
            new Set([
              ...((uidMap.get(up.uid) && uidMap.get(up.uid).groupIds) || []),
              key,
            ])
          ),
          upName: up.name,
          type: up.type || [],
        });

        await common.sleep(2000);
      }
    }

    let now = Date.now() / 1000;

    this.key = "Yz:xianxin:bilibili:upPush:";

    Bot.logger.mark("xianxin插件：B站动态定时检测");

    for (let [key, value] of uidMap) {
      // const accInfoRes = await this.getBilibiliUserInfo(key);

      const tempDynamicList = dynamicList[key] || [];

      const willPushDynamicList = [];

      for (let dynamicItem of tempDynamicList) {
        let author = dynamicItem?.modules?.module_author || {};
        if (!author?.pub_ts) continue;
        /** 不满足时间的不放入待推送动态 */
        if (Number(now - author.pub_ts) > interval) {
          continue;
        }
        /** 不放入直播的动态，直接走新接口 */
        // if (dynamicItem.type == "DYNAMIC_TYPE_LIVE_RCMD") {
        //   continue;
        // }
        /** 如果关闭了转发动态不推送, 那么直接在这里不放入待推送数据里 */
        if (
          dynamicItem.type == "DYNAMIC_TYPE_FORWARD" &&
          !setData.pushTransmit
        ) {
          continue;
        }
        willPushDynamicList.push(dynamicItem);
      }

      const pushMapInfo = value || {};

      const { groupIds, upName, type } = pushMapInfo;

      // if (accInfoRes.ok) {
      //   const accInfoResJsonData = await accInfoRes.json();

      //   const data = accInfoResJsonData?.data || null;
      //   if (data && data.live_room) {
      //     if (
      //       `${lastLiveStatusInfo[key] || 0}${data.live_room.liveStatus}` ==
      //       "01"
      //     ) {
      //       willPushDynamicList.push({
      //         id_str: `${new Date().getTime()}`,
      //         type: "DYNAMIC_TYPE_LIVE_RCMD",
      //         title: data.live_room.title,
      //         url: this.formatUrl(data.live_room.url),
      //         cover: data.live_room.cover,
      //         name: data.name,
      //         face: data.face,
      //       });
      //     }
      //     lastLiveStatusInfo[key] = data.live_room.liveStatus;

      //     await redis.set(
      //       "xianxin:bililive:lastlivestatus",
      //       JSON.stringify(lastLiveStatusInfo),
      //       { EX: 60 * 60 }
      //     );
      //   }
      // }

      for (let pushDynamicData of willPushDynamicList) {
        if (groupIds && groupIds.length) {
          for (let groupId of groupIds) {
            /** 如果禁用了type那么不发送指令 */
            if (type && type.length && !type.includes(pushDynamicData.type)) {
              continue;
            }

            await this.sendDynamic(groupId, upName, pushDynamicData, setData);
          }
        }
      }
      await common.sleep(1000);
    }
  }

  // 推送消息失败重试
  // async pushAgain(groupId, msg) {
  //   await common.sleep(5000);
  //   Bot.pickGroup(groupId)
  //     .sendMsg(msg)
  //     .catch((err) => {
  //       logger.error(`群[${groupId}]第二次推送失败：${JSON.stringify(err)}`);
  //     });

  //   return;
  // }

  async sendDynamic(groupId, upName, pushDynamicData, setData) {
    const id_str = pushDynamicData.id_str;

    let sended = await redis.get(`${this.key}${groupId}:${id_str}`);
    if (sended) return;

    this.e.group = Bot.pickGroup(Number(groupId));

    if (!!setData.pushMsgMode) {
      const data = this.dynamicDataHandle(pushDynamicData);
      // 包含关键字不推送
      let banWords = eval(`/${setData.banWords.join("|")}/g`);
      if (new RegExp(banWords).test(`${data.data.title}${data.data.content}`)) {
        return "return";
      }

      if (!this[id_str]) {
        const dynamicMsg = await this.render(data);
        const img = dynamicMsg;

        this[id_str] = {
          img: img[0],
        };
      }

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

      Bot.logger.mark("xianxin插件：B站动态执行推送");

      await this.e.group.sendMsg(this[id_str].img).catch((err) => {
        logger.error(`群[${groupId}]推送失败：${JSON.stringify(err)}`);
        // this.pushAgain(Number(groupId), this[id_str].img);
      });
      await common.sleep(1000);
    } else {
      const dynamicMsg = this.buildDynamic(
        upName,
        pushDynamicData,
        false,
        setData
      );

      redis.set(`${this.key}${groupId}:${id_str}`, "1", { EX: 3600 * 10 });

      if (dynamicMsg == "continue") {
        return "return";
      }

      // 包含关键字不推送
      let banWords = eval(`/${setData.banWords.join("|")}/g`);
      if (new RegExp(banWords).test(dynamicMsg.join(""))) {
        return "return";
      }
      await this.e.group.sendMsg(dynamicMsg);
      await common.sleep(1000);
    }
  }

  dynamicDataHandle = (data) => {
    const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
    let desc,
      pics = [];
    let dynamic = { data: {} };

    let author = data?.modules?.module_author || {};

    dynamic.data.face = author.face;
    dynamic.data.name = author.name;

    dynamic.data.pendant = author?.pendant?.image || data?.pendant?.image;

    dynamic.data.created = moment().format("YYYY年MM月DD日 HH:mm:ss");

    dynamic.data.type = data.type;
    if (data.type == "DYNAMIC_TYPE_AV") {
      desc = data?.modules?.module_dynamic?.major?.archive || {};
      dynamic.data.title = desc.title;
      dynamic.data.content = desc.desc;
      dynamic.data.url = this.formatUrl(desc.jump_url);
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.category = "视频动态";
      dynamic.data.pics = [desc.cover];
    } else if (data.type == "DYNAMIC_TYPE_WORD") {
      desc = data?.modules?.module_dynamic?.desc || {};
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = [];
      dynamic.data.category = "图文动态";
    } else if (data.type == "DYNAMIC_TYPE_DRAW") {
      desc = data?.modules?.module_dynamic?.desc || {};
      pics = data?.modules?.module_dynamic?.major?.draw?.items || [];
      pics = pics.map((item) => {
        return item.src;
      });
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = pics;
      dynamic.data.category = "图文动态";
    } else if (data.type == "DYNAMIC_TYPE_ARTICLE") {
      desc = data?.modules?.module_dynamic?.major?.article || {};
      if (desc.covers && desc.covers.length) {
        pics = desc.covers;
      }
      dynamic.data.title = desc.title;
      dynamic.data.content = "";
      dynamic.data.url = this.formatUrl(desc.jump_url);
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.pics = pics;
      dynamic.data.category = "文章动态";
    } else if (data.type == "DYNAMIC_TYPE_FORWARD") {
      desc = data?.modules?.module_dynamic?.desc || {};
      dynamic.data.title = "";
      dynamic.data.content = desc.text;
      dynamic.data.pubTime = author.pub_time;
      dynamic.data.pubTs = moment(author.pub_ts * 1000).format(
        "YYYY年MM月DD日 HH:mm:ss"
      );
      dynamic.data.url = `${BiliDrawDynamicLinkUrl}${data.id_str}`;
      dynamic.data.pics = [data.cover];
      dynamic.data.orig = this.dynamicDataHandle(data.orig);
      dynamic.data.category = "转发动态";
    } else if (data.type == "DYNAMIC_TYPE_LIVE_RCMD") {
      desc = data?.modules?.module_dynamic?.major?.live_rcmd?.content;
      if (!desc) return;
      desc = JSON.parse(desc);
      desc = desc?.live_play_info;
      if (!desc) return;
      dynamic.data.title = desc.title;
      dynamic.data.content = "";
      dynamic.data.pubTime = "";
      dynamic.data.pubTs = "";
      dynamic.data.url = desc.link;
      dynamic.data.pics = [desc.cover];
      dynamic.data.category = "直播动态";
    }

    return {
      ...this.screenData,
      saveId: data.id_str,
      ...dynamic,
    };
  };

  /**
   * 处理b站动态页图片生成
   * @param {object} param
   * @returns {img: string[], code: string}
   */
  async render(param) {
    return await puppeteer.screenshots(this.model, param)
  }

  // 生成动态消息文字内容
  buildDynamic(upName, dynamic, isForward, setData) {
    const BiliDrawDynamicLinkUrl = "https://m.bilibili.com/dynamic/";
    let desc, msg, pics, author;
    let title = `B站【${upName}】动态推送：\n`;

    switch (dynamic.type) {
      case "DYNAMIC_TYPE_AV":
        desc = dynamic?.modules?.module_dynamic?.major?.archive;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        title = `B站【${upName}】视频动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `${desc.desc}\n`,
          `链接：${this.formatUrl(desc.jump_url)}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          segment.image(desc.cover),
        ];

        return msg;
      case "DYNAMIC_TYPE_WORD":
        desc = dynamic?.modules?.module_dynamic?.desc;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        title = `B站【${upName}】动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `内容：${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }`,
        ];

        return msg;
      case "DYNAMIC_TYPE_DRAW":
        desc = dynamic?.modules?.module_dynamic?.desc;
        pics = dynamic?.modules?.module_dynamic?.major?.draw?.items;
        author = dynamic?.modules?.module_author;
        if (!desc && !pics && !author) return;

        const dynamicPicCountLimit = setData.pushPicCountLimit || 3;

        if (pics.length > dynamicPicCountLimit)
          pics.length = dynamicPicCountLimit;

        pics = pics.map((item) => {
          return segment.image(item.src);
        });

        title = `B站【${upName}】图文动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          ...pics,
        ];

        return msg;
      case "DYNAMIC_TYPE_ARTICLE":
        desc = dynamic?.modules?.module_dynamic?.major?.article;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;

        pics = [];
        if (desc.covers && desc.covers.length) {
          pics = desc.covers.map((item) => {
            return segment.image(item);
          });
        }

        title = `B站【${upName}】文章动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `链接：${this.formatUrl(desc.jump_url)}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          ...pics,
        ];

        return msg;
      case "DYNAMIC_TYPE_FORWARD":
        desc = dynamic?.modules?.module_dynamic?.desc;
        author = dynamic?.modules?.module_author;
        if (!desc && !author) return;
        if (!dynamic.orig) return;

        let orig = this.buildDynamic(upName, dynamic.orig, true, setData);
        if (orig && orig.length) {
          orig = orig.slice(2);
        } else {
          return false;
        }

        title = `B站【${upName}】转发动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `${this.dynamicContentLimit(desc.text, setData)}\n`,
          `链接：${BiliDrawDynamicLinkUrl}${dynamic.id_str}\n`,
          `时间：${author
            ? moment(author.pub_ts * 1000).format("YYYY年MM月DD日 HH:mm:ss")
            : ""
          }\n`,
          "\n---以下为转发内容---\n",
          ...orig,
        ];

        return msg;
      case "DYNAMIC_TYPE_LIVE_RCMD":
        desc = dynamic?.modules?.module_dynamic?.major?.live_rcmd?.content;
        if (!desc) return;
        desc = JSON.parse(desc);
        desc = desc?.live_play_info;
        if (!desc) return;
        title = `B站【${upName}】直播动态推送：\n`;
        msg = [
          title,
          `-----------------------------\n`,
          `标题：${desc.title}\n`,
          `链接：${desc.link}\n`,
          segment.image(desc.cover),
        ];

        return msg;
      default:
        Bot.logger.mark(`未处理的B站推送【${upName}】：${dynamic.type}`);
        return "continue";
    }
  }

  // 限制文字模式下动态内容的字数和行数
  dynamicContentLimit(content, setData) {
    content = content.split("\n");

    let lenLimit = setData.pushContentLenLimit || 100;
    let lineLimit = setData.pushContentLineLimit || 5;

    if (content.length > lineLimit) content.length = lineLimit;

    let contentLen = 0;
    let outLen = false;
    for (let i = 0; i < content.length; i++) {
      let len = lenLimit - contentLen;

      if (outLen) {
        content.splice(i--, 1);
        continue;
      }
      if (content[i].length > len) {
        content[i] = content[i].substr(0, len);
        content[i] = `${content[i]}...`;
        contentLen = lenLimit;
        outLen = true;
      }
      contentLen += content[i].length;
    }

    return content.join("\n");
  }

  // 处理斜杠开头的url
  formatUrl(url) {
    if (url.indexOf("//") == 0) {
      return `https:${url}`;
    }
    return url;
  }
}
