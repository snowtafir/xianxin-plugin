import plugin from "../../../lib/plugins/plugin.js";
import Mys from "../model/mys.js";
import common from "../../../lib/common/common.js";
import xxCfg from "../model/xxCfg.js";
import fs from "node:fs";

/**
 * 初始化米游社设置文件
 */
let mysSetFile = "./plugins/trss-xianxin-plugin/config/mys.set.yaml";
if (!fs.existsSync(mysSetFile)) {
  fs.copyFileSync("./plugins/trss-xianxin-plugin/defSet/mys/set.yaml", mysSetFile);
}

/**
 * 米游社相关内容
 */
export class mys extends plugin {
  constructor() {
    super({
      name: "米游社功能",
      dsc: "处理米游社中获取wiki、攻略、cos、话题、同人等内容",
      event: "message",
      priority: 800,
      rule: [
        {
          reg: "^#*原神攻略\\s*.*$",
          fnc: "ysSearchStrategy",
        },
        {
          reg: "^#*原神wiki\\s*.*$",
          fnc: "ysSearchWiki",
        },
        {
          reg: "^#*原神cos[a-z]*[0-9]*$",
          fnc: "ysCos",
        },
        {
          reg: "^#*原神cos[a-z]*[0-9]*详情$",
          fnc: "ysCosDetail",
        },
        {
          reg: "^#*原神cos(dby)*\\s*.*$",
          fnc: "ysSearchCos",
        },
        {
          reg: "^#*原神同人[0-9]*$",
          fnc: "ysAcgn",
        },
        {
          reg: "^#*原神同人[0-9]*详情$",
          fnc: "ysAcgnDetail",
        },
        {
          reg: "^#*原神同人\\s*.*$",
          fnc: "ysSearchAcgn",
        },
        {
          reg: "^#*原神热门话题[0-9]*$",
          fnc: "ysHotchat",
        },
        {
          reg: "^#*星铁攻略\\s*.*$",
          fnc: "srSearchStrategy",
        },
        {
          reg: "^#*星铁wiki\\s*.*$",
          fnc: "srSearchWiki",
        },
        {
          reg: "^#*星铁cos[a-z]*[0-9]*$",
          fnc: "srCos",
        },
        {
          reg: "^#*星铁cos[a-z]*[0-9]*详情$",
          fnc: "srCosDetail",
        },
        {
          reg: "^#*星铁cos(dby)*\\s*.*$",
          fnc: "srSearchCos",
        },
        {
          reg: "^#*星铁同人[0-9]*$",
          fnc: "srAcgn",
        },
        {
          reg: "^#*星铁同人[0-9]*详情$",
          fnc: "srAcgnDetail",
        },
        {
          reg: "^#*星铁同人\\s*.*$",
          fnc: "srSearchAcgn",
        },
        {
          reg: "^#*星铁热门话题[0-9]*$",
          fnc: "srHotchat",
        },
      ],
    });

    /** 读取米游社相关设置数据 */
    this.mysSetData = xxCfg.getConfig("mys", "set");
  }

  /**
   * rule - 米游社 原神 热门话题
   */
  async ysHotchat() {
    let index = this.e.msg.replace(/#*原神热门话题/g, "") || 0;
    const chatData = await new Mys().getChatData('ys');

    const data = chatData[index];
    if (data) {
      this.e.reply(`热门话题：${data.title}\n话题地址：${data.url}`);
    } else {
      this.e.reply("额，没有找到合适的话题哦～");
    }
  }

  /**
   * rule - 米游社 原神 同人
   * @returns
   */
  async ysAcgn() {
    const isPrivate = this.e.isPrivate;

    let index = this.e.msg.replace(/#*原神同人/g, "") || 0;
    const acgnData = await new Mys().getAcgnData('ys');
    const data = acgnData[index];
    if (data) {
      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }

      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.e.reply("额。没有找到合适的同人信息～");
    }
  }

  /**搜索原神 同人 */
  async ysSearchAcgn() {
    const isPrivate = this.e.isPrivate;
    let title = this.e.msg.replace(/#*原神同人/g, "").trim();

    const randomMax = 50;

    const randomIndex = Math.floor(Math.random() * randomMax) + 1;

    const last_id = Math.ceil(randomIndex / 20);

    const keyword = encodeURIComponent(title);

    const index = randomIndex % 20;

    const cosData = await new Mys().getAcgnSearchData(keyword, last_id, 'ys');

    const data = cosData[index];

    if (data) {
      if (!data.images || !data.images.length) {
        this.ysSearchAcgn();
        return;
      }

      if (!this.mysSetData.isReplyMulti) {
        const randomImgIdx = Math.floor(Math.random() * data.images.length);
        data.images = [data.images[randomImgIdx]];
      }

      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的同人信息～");
    }
  }

  /**
   * rule - 米游社 原神 同人详情
   */
  async ysAcgnDetail() {
    let index = this.e.msg.replace(/#*原神同人/g, "").replace("详情", "") || 0;
    const acgnData = await new Mys().getAcgnData('ys');
    const data = acgnData[index];
    if (data) {
      const message = `标题：${data.title}\n地址：${data.url}\n作者：${data.nickname}\n点赞：${data.like_num}`;
      this.e.reply(message);
    } else {
      this.e.reply("额。没有找到合适的同人信息～");
    }
  }

  /**
   * rule - 米游社 原神cos
   * @returns
   */
  async ysCos() {
    const isPrivate = this.e.isPrivate;
    let index = this.e.msg.replace(/#*原神cos/g, "").replace(/dby/g, "") || 0;

    let forum_class = "ys";
    const forum_class1 = 'ys';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }

    const cosData = await new Mys().getCosData(forum_class, forum_class1);

    if (index === 0) {
      index = Math.floor(Math.random() * cosData.length);
    }
    const data = cosData[index];
    if (data) {
      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 米游社 原神cos详情
   */
  async ysCosDetail() {
    let index =
      this.e.msg
        .replace(/#*原神cos/g, "")
        .replace(/dby/g, "")
        .replace("详情", "") || 0;

    let forum_class = "ys";
    const forum_class1 = 'ys';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }
    const cosData = await new Mys().getCosData(forum_class, forum_class1);
    const data = cosData[index];
    if (data) {
      const message = `标题：${data.title}\n地址：${data.url}\n作者：${data.nickname}\n点赞：${data.like_num}`;
      this.reply(message);
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 搜索米游社 原神cos
   * @returns
   */
  async ysSearchCos() {
    const isPrivate = this.e.isPrivate;
    let role = this.e.msg.replace(/#*原神cos(dby)*/g, "").trim();

    let forum_class = "ys";
    const forum_class1 = 'ys';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }

    const randomMax = this.mysSetData.cosRandomMax || forum_class === "dby" ? 40 : 100;

    const randomIndex = Math.floor(Math.random() * randomMax) + 1;

    const last_id = Math.ceil(randomIndex / 20);

    const keyword = encodeURIComponent(role);

    const index = randomIndex % 20;

    const cosData = await new Mys().getCosSearchData(keyword, last_id, forum_class, forum_class1);

    const data = cosData[index];

    if (data) {
      if (!data.images || !data.images.length) {
        this.searchCos();
        return;
      }

      if (!this.mysSetData.isReplyMulti) {
        const randomImgIdx = Math.floor(Math.random() * data.images.length);
        data.images = [data.images[randomImgIdx]];
      }

      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 米游社搜索 原神wiki内容
   * @returns
   */
  async ysSearchWiki() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*原神wiki/g, "").trim();

    const wikiData = await new Mys().getWikiSearchData(keyword, "ysWiki");

    if (wikiData.length) {
      if (this.mysSetData.wikiMode) {
        if (this.mysSetData.isExactMatch) {
          wikiData.length = 1;
        }

        let msgList = [];
        for (let item of wikiData) {
          msgList.push({
            message: `标题：${item.title}\n标签：${item.tags.join(
              "，"
            )}\n链接：${item.href}`,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }

        if (msgList.length == 1) {
          await this.e.reply(msgList[0].message);
        } else {
          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      } else {
        const data = wikiData[0];
        const isSplit = this.mysSetData.strategyMode == 2;
        const forum_class = 'ysWiki';
        const renderInfo = await new Mys().getWikiPage(data, isSplit, forum_class);
        if (!renderInfo) return;

        const { img, code } = renderInfo;

        if (code === "limit") {
          if (this.mysSetData.isExactMatch) {
            wikiData.length = 1;
          }

          let msgList = [];
          for (let item of wikiData) {
            msgList.push({
              message: `标题：${item.title}\n标签：${item.tags.join(
                "，"
              )}\n链接：${item.href}`,
              nickname: Bot.nickname,
              user_id: Bot.uin,
            });
          }

          if (msgList.length == 1) {
            await this.e.reply(msgList[0].message);
          } else {
            await this.e.reply(await Bot.makeForwardMsg(msgList));
          }
          return "return";
        }

        if (img.length == 1) {
          await this.e.reply(img[0]);
        } else {
          let msgList = [];

          msgList.unshift({
            message: data.title,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          for (let item of img) {
            if (isPrivate) {
              await this.e.reply(item);
              await common.sleep(600);
            } else {
              msgList.push({
                message: item,
                nickname: Bot.nickname,
                user_id: Bot.uin,
              });
            }
          }
          if (isPrivate) {
            return;
          }

          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      }
    } else {
      this.reply("额。没有找到wiki内容，换个关键词试试吧～");
    }
  }

  /**
   * rule - 米游社搜索 原神攻略内容
   * @returns
   */
  async ysSearchStrategy() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*原神攻略/g, "").trim();

    const wikiData = await new Mys().getWikiSearchData(keyword, "ysStrategy");

    if (wikiData.length) {
      if (this.mysSetData.strategyMode == 1) {
        if (this.mysSetData.isExactMatch) {
          wikiData.length = 1;
        }

        let msgList = [];
        for (let item of wikiData) {
          msgList.push({
            message: `标题：${item.title}\n标签：${item.tags.join(
              "，"
            )}\n链接：${item.href}`,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }

        if (msgList.length == 1) {
          await this.e.reply(msgList[0].message);
        } else {
          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      } else {
        const data = wikiData[0];
        const isSplit = this.mysSetData.strategyMode == 2;
        const renderInfo = await new Mys().strategySearch(data, isSplit);
        if (!renderInfo) return;

        const { img, code } = renderInfo;

        if (code === "limit") {
          if (this.mysSetData.isExactMatch) {
            wikiData.length = 1;
          }

          let msgList = [];
          for (let item of wikiData) {
            msgList.push({
              message: `标题：${item.title}\n标签：${item.tags.join(
                "，"
              )}\n链接：${item.href}`,
              nickname: Bot.nickname,
              user_id: Bot.uin,
            });
          }

          if (msgList.length == 1) {
            await this.e.reply(msgList[0].message);
          } else {
            await this.e.reply(await Bot.makeForwardMsg(msgList));
          }
          return "return";
        }

        if (img && img.length == 1) {
          await this.e.reply(img[0]);
        } else {
          let msgList = [];

          msgList.unshift({
            message: data.title,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          for (let item of img) {
            if (isPrivate) {
              await this.e.reply(item);
              await common.sleep(600);
            } else {
              msgList.push({
                message: item,
                nickname: Bot.nickname,
                user_id: Bot.uin,
              });
            }
          }

          if (isPrivate) {
            return;
          }
          msgList = await this.e.group.makeForwardMsg(msgList);
          this.e.reply(msgList);
        }
      }
    } else {
      this.e.reply("额。没有找到攻略内容，换个关键词试试吧～");
    }
  }

  /**
   * rule - 米游社 星穹铁道 热门话题
   */
  async srHotchat() {
    let index = this.e.msg.replace(/#*星铁热门话题/g, "") || 0;
    const chatData = await new Mys().getChatData('sr');

    const data = chatData[index];
    if (data) {
      this.e.reply(`热门话题：${data.title}\n话题地址：${data.url}`);
    } else {
      this.e.reply("额，没有找到合适的话题哦～");
    }
  }

  /**
   * rule - 米游社 星穹铁道 同人
   * @returns
   */
  async srAcgn() {
    const isPrivate = this.e.isPrivate;

    let index = this.e.msg.replace(/#*星铁同人/g, "") || 0;
    const acgnData = await new Mys().getAcgnData('sr');
    const data = acgnData[index];
    if (data) {
      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }

      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.e.reply("额。没有找到合适的同人信息～");
    }
  }

  /**搜索 星铁 同人 */
  async srSearchAcgn() {
    const isPrivate = this.e.isPrivate;
    let title = this.e.msg.replace(/#*星铁同人/g, "").trim();

    const randomMax = 50;

    const randomIndex = Math.floor(Math.random() * randomMax) + 1;

    const last_id = Math.ceil(randomIndex / 20);

    const keyword = encodeURIComponent(title);

    const index = randomIndex % 20;

    const cosData = await new Mys().getAcgnSearchData(keyword, last_id, 'sr');

    const data = cosData[index];

    if (data) {
      if (!data.images || !data.images.length) {
        this.srSearchAcgn();
        return;
      }

      if (!this.mysSetData.isReplyMulti) {
        const randomImgIdx = Math.floor(Math.random() * data.images.length);
        data.images = [data.images[randomImgIdx]];
      }

      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的同人信息～");
    }
  }

  /**
   * rule - 米游社 星穹铁道 同人详情
   */
  async srAcgnDetail() {
    let index = this.e.msg.replace(/#*星铁同人/g, "").replace("详情", "") || 0;
    const acgnData = await new Mys().getAcgnData('sr');
    const data = acgnData[index];
    if (data) {
      const message = `标题：${data.title}\n地址：${data.url}\n作者：${data.nickname}\n点赞：${data.like_num}`;
      this.e.reply(message);
    } else {
      this.e.reply("额。没有找到合适的同人信息～");
    }
  }

  /**
   * rule - 米游社 星穹铁道cos
   * @returns
   */
  async srCos() {
    const isPrivate = this.e.isPrivate;
    let index = this.e.msg.replace(/#*星铁cos/g, "").replace(/dby/g, "") || 0;

    let forum_class = "sr";
    const forum_class1 = 'sr';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }

    const cosData = await new Mys().getCosData(forum_class, forum_class1);

    if (index === 0) {
      index = Math.floor(Math.random() * cosData.length);
    }
    const data = cosData[index];
    if (data) {
      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 米游社 星穹铁道cos详情
   */
  async srCosDetail() {
    let index =
      this.e.msg
        .replace(/#*星铁cos/g, "")
        .replace(/dby/g, "")
        .replace("详情", "") || 0;

    let forum_class = "sr";
    const forum_class1 = 'sr';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }
    const cosData = await new Mys().getCosData(forum_class, forum_class1);
    const data = cosData[index];
    if (data) {
      const message = `标题：${data.title}\n地址：${data.url}\n作者：${data.nickname}\n点赞：${data.like_num}`;
      this.reply(message);
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 搜索米游社 星穹铁道cos
   * @returns
   */
  async srSearchCos() {
    const isPrivate = this.e.isPrivate;
    let role = this.e.msg.replace(/#*星铁cos(dby)*/g, "").trim();

    let forum_class = "sr";
    const forum_class1 = 'sr';
    if (this.e.msg.indexOf("dby") !== -1) {
      forum_class = "dby";
    }

    const randomMax = this.mysSetData.cosRandomMax || forum_class === "dby" ? 40 : 100;

    const randomIndex = Math.floor(Math.random() * randomMax) + 1;

    const last_id = Math.ceil(randomIndex / 20);

    const keyword = encodeURIComponent(role);

    const index = randomIndex % 20;

    const cosData = await new Mys().getCosSearchData(keyword, last_id, forum_class, forum_class1);

    const data = cosData[index];

    if (data) {
      if (!data.images || !data.images.length) {
        this.srSearchCos();
        return;
      }

      if (!this.mysSetData.isReplyMulti) {
        const randomImgIdx = Math.floor(Math.random() * data.images.length);
        data.images = [data.images[randomImgIdx]];
      }

      let msgList = [];
      for (let imageItem of data.images) {
        if (isPrivate) {
          await this.e.reply(segment.image(imageItem));
          await common.sleep(600);
        } else {
          msgList.push({
            message: segment.image(imageItem),
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }
      }

      if (isPrivate) {
        return;
      }
      if (msgList.length == 1) {
        await this.e.reply(msgList[0].message);
      } else {
        await this.e.reply(await Bot.makeForwardMsg(msgList));
      }
    } else {
      this.reply("额。没有找到合适的cos信息～");
    }
  }

  /**
   * rule - 米游社搜索 星穹铁道wiki内容
   * @returns
   */
  async srSearchWiki() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*星铁wiki/g, "").trim();

    const wikiData = await new Mys().getWikiSearchData(keyword, "srWiki");

    if (wikiData.length) {
      if (this.mysSetData.wikiMode) {
        if (this.mysSetData.isExactMatch) {
          wikiData.length = 1;
        }

        let msgList = [];
        for (let item of wikiData) {
          msgList.push({
            message: `标题：${item.title}\n标签：${item.tags.join(
              "，"
            )}\n链接：${item.href}`,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }

        if (msgList.length == 1) {
          await this.e.reply(msgList[0].message);
        } else {
          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      } else {
        const data = wikiData[0];
        const isSplit = this.mysSetData.strategyMode == 2;
        const forum_class = 'sr';
        const renderInfo = await new Mys().getWikiPage(data, isSplit, forum_class);
        if (!renderInfo) return;

        const { img, code } = renderInfo;

        if (code === "limit") {
          if (this.mysSetData.isExactMatch) {
            wikiData.length = 1;
          }

          let msgList = [];
          for (let item of wikiData) {
            msgList.push({
              message: `标题：${item.title}\n标签：${item.tags.join(
                "，"
              )}\n链接：${item.href}`,
              nickname: Bot.nickname,
              user_id: Bot.uin,
            });
          }

          if (msgList.length == 1) {
            await this.e.reply(msgList[0].message);
          } else {
            await this.e.reply(await Bot.makeForwardMsg(msgList));
          }
          return "return";
        }

        if (img.length == 1) {
          await this.e.reply(img[0]);
        } else {
          let msgList = [];

          msgList.unshift({
            message: data.title,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          for (let item of img) {
            if (isPrivate) {
              await this.e.reply(item);
              await common.sleep(600);
            } else {
              msgList.push({
                message: item,
                nickname: Bot.nickname,
                user_id: Bot.uin,
              });
            }
          }
          if (isPrivate) {
            return;
          }

          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      }
    } else {
      this.reply("额。没有找到wiki内容，换个关键词试试吧～");
    }
  }

  /**
   * rule - 米游社搜索 星穹铁道攻略内容
   * @returns
   */
  async srSearchStrategy() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*星铁/g, "").trim();

    const wikiData = await new Mys().getWikiSearchData(keyword, "srWiki");

    if (wikiData.length) {
      if (this.mysSetData.strategyMode == 1) {
        if (this.mysSetData.isExactMatch) {
          wikiData.length = 1;
        }

        let msgList = [];
        for (let item of wikiData) {
          msgList.push({
            message: `标题：${item.title}\n标签：${item.tags.join(
              "，"
            )}\n链接：${item.href}`,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
        }

        if (msgList.length == 1) {
          await this.e.reply(msgList[0].message);
        } else {
          await this.e.reply(await Bot.makeForwardMsg(msgList));
        }
      } else {
        const data = wikiData[0];
        const isSplit = this.mysSetData.strategyMode == 2;
        const renderInfo = await new Mys().strategySearch(data, isSplit);
        if (!renderInfo) return;

        const { img, code } = renderInfo;

        if (code === "limit") {
          if (this.mysSetData.isExactMatch) {
            wikiData.length = 1;
          }

          let msgList = [];
          for (let item of wikiData) {
            msgList.push({
              message: `标题：${item.title}\n标签：${item.tags.join(
                "，"
              )}\n链接：${item.href}`,
              nickname: Bot.nickname,
              user_id: Bot.uin,
            });
          }

          if (msgList.length == 1) {
            await this.e.reply(msgList[0].message);
          } else {
            await this.e.reply(await Bot.makeForwardMsg(msgList));
          }
          return "return";
        }

        if (img && img.length == 1) {
          await this.e.reply(img[0]);
        } else {
          let msgList = [];

          msgList.unshift({
            message: data.title,
            nickname: Bot.nickname,
            user_id: Bot.uin,
          });
          for (let item of img) {
            if (isPrivate) {
              await this.e.reply(item);
              await common.sleep(600);
            } else {
              msgList.push({
                message: item,
                nickname: Bot.nickname,
                user_id: Bot.uin,
              });
            }
          }

          if (isPrivate) {
            return;
          }
          msgList = await this.e.group.makeForwardMsg(msgList);
          this.e.reply(msgList);
        }
      }
    } else {
      this.e.reply("额。没有找到攻略内容，换个关键词试试吧～");
    }
  }
}
