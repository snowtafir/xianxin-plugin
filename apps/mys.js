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
          reg: "^#*(原神|星铁)攻略\\s*.*$",
          fnc: "searchStrategy",
        },
        {
          reg: "^#*(原神|星铁)wiki\\s*.*$",
          fnc: "searchWiki",
        },
        {
          reg: "^#*(原神|星铁)cos[a-z]*[0-9]*$",
          fnc: "cos",
        },
        {
          reg: "^#*(原神|星铁)cos[a-z]*[0-9]*详情$",
          fnc: "cosDetail",
        },
        {
          reg: "^#*(原神|星铁)cos(dby)*\\s*.*$",
          fnc: "searchCos",
        },
        {
          reg: "^#*(原神|星铁)同人[0-9]*$",
          fnc: "acgn",
        },
        {
          reg: "^#*(原神|星铁)同人[0-9]*详情$",
          fnc: "acgnDetail",
        },
        {
          reg: "^#*(原神|星铁)同人\\s*.*$",
          fnc: "searchAcgn",
        },
        {
          reg: "^#*(原神|星铁)热门话题[0-9]*$",
          fnc: "hotchat",
        },
      ],
    });

    /** 读取米游社相关设置数据 */
    this.mysSetData = xxCfg.getConfig("mys", "set");
  }

  /**
   * rule - 米游社 原神ys 星铁sr 热门话题
   */
  async hotchat() {
    let index = this.e.msg.replace(/#*(原神|星铁)热门话题/g, "") || 0;
    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    const chatData = await new Mys().getChatData(game_tag);

    const data = chatData[index];
    if (data) {
      this.e.reply(`热门话题：${data.title}\n话题地址：${data.url}`);
    } else {
      this.e.reply("额，没有找到合适的话题哦～");
    }
  }

  /**
   * rule - 米游社 原神ys 星铁sr 同人
   * @returns
   */
  async acgn() {
    const isPrivate = this.e.isPrivate;

    let index = this.e.msg.replace(/#*(原神|星铁)同人/g, "") || 0;
    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    const acgnData = await new Mys().getAcgnData(game_tag);
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

  /**搜索原神ys 星铁sr 同人 */
  async searchAcgn() {
    const isPrivate = this.e.isPrivate;
    let title = this.e.msg.replace(/#*(原神|星铁)同人/g, "").trim();
    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    const randomMax = 50;

    const randomIndex = Math.floor(Math.random() * randomMax) + 1;

    const last_id = Math.ceil(randomIndex / 20);

    const keyword = encodeURIComponent(title);

    const index = randomIndex % 20;

    const cosData = await new Mys().getAcgnSearchData(keyword, last_id, game_tag);

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
   * rule - 米游社 原神ys 星铁sr 同人详情
   */
  async acgnDetail() {
    let index = this.e.msg.replace(/#*(原神|星铁)同人/g, "").replace("详情", "") || 0;
    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    const acgnData = await new Mys().getAcgnData(game_tag);
    const data = acgnData[index];
    if (data) {
      const message = `标题：${data.title}\n地址：${data.url}\n作者：${data.nickname}\n点赞：${data.like_num}`;
      this.e.reply(message);
    } else {
      this.e.reply("额。没有找到合适的同人信息～");
    }
  }

  /**
   * rule - 米游社 原神ys 星铁sr cos
   * @returns
   */
  async cos() {
    const isPrivate = this.e.isPrivate;
    let index = this.e.msg.replace(/#*(原神|星铁)cos/g, "").replace(/dby/g, "") || 0;

    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    let forum_class = game_tag;
    const forum_class1 = game_tag;
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
   * rule - 米游社 原神ys 星铁sr cos详情
   */
  async cosDetail() {
    let index =
      this.e.msg
        .replace(/#*(原神|星铁)cos/g, "")
        .replace(/dby/g, "")
        .replace("详情", "") || 0;

    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    let forum_class = game_tag;
    const forum_class1 = game_tag;
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
   * rule - 搜索米游社 原神ys 星铁sr cos
   * @returns
   */
  async searchCos() {
    const isPrivate = this.e.isPrivate;
    let role = this.e.msg.replace(/#*(原神|星铁)cos(dby)*/g, "").trim();

    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'sr' : 'ys';

    let forum_class = game_tag;
    const forum_class1 = game_tag;
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
   * rule - 米游社搜索 原神ys 星铁sr wiki/百科 内容
   * @returns
   */
  async searchWiki() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*(原神|星铁)wiki/g, "").trim();

    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'srWiki' : 'ysWiki';

    const wikiData = await new Mys().getWikiSearchData(keyword, game_tag);

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
   * rule - 米游社搜索 原神ys 星铁sr 攻略内容
   * @returns
   */
  async searchStrategy() {
    const isPrivate = this.e.isPrivate;
    let keyword = this.e.msg.replace(/#*(原神|星铁)/g, "").trim();

    let regex = /(原神|星铁)/g;
    let match = regex.exec(this.e.msg);
    let game_tag = match[1] === '星铁' ? 'srWiki' : 'ysStrategy';

    const wikiData = await new Mys().getWikiSearchData(keyword, game_tag);

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
