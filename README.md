<p align="center">
  <a href="https://gitee.com/snowtafir/xianxin-plugin">
    <img width="200" src="https://gitee.com/snowtafir/xianxin-plugin/raw/main/resources/img/rank/top.png">
  </a>
</p>

<h1 align="center">主要适配TRSS-Yunzai的xianxin-plugin</h1>

<div align="center">

是 <a href="https://gitee.com/TimeRainStarSky/Yunzai" target="_blank">TRSS-Yunzai</a> 关于B站推送、微博推送、原神cos、wiki查询和群战等功能的扩展插件

[![访问量](https://profile-counter.glitch.me/trss-xianxin-plugin/count.svg)](https://gitee.com/snowtafir/xianxin-plugin)


<img src="https://cdn.jsdelivr.net/gh/xianxincoder/xianxincoder/assets/github-contribution-grid-snake.svg">

</div>
<br />
<br />

## 📦 安装与更新与配置

1. 推荐使用 git 进行安装，以方便后续升级。在`Yunzai`根目录打开 `终端shell`/`git bash`，运行如下命令（gitee/github选其一）进行安装：

Gitee：

```shell
git clone https://gitee.com/snowtafir/xianxin-plugin.git ./plugins/trss-xianxin-plugin/
```
Github：
```shell
git clone https://github.com/snowtafir/xianxin-plugin.git ./plugins/trss-xianxin-plugin/
```
2. 接着在bot目录或插件目录下执行依赖安装即可：
```
pnpm i
```

> * 如果是下载压缩包到本地，解压后把插件文件夹重命名为`trss-xianxin-plugin`放到`Yunzai/plugins/`下即可（该方式不能使用`#闲心插件更新`或git方式更新插件）。

3. 后续更新可通过 `#闲心插件更新` 进行，或者在`Yunzai/plugins/trss-xianxin-plugin/`目录下打开 `终端shell`/`git bash`执行：
```shell
git pull
```
接着在`Yunzai`根目录已经打开的运行着的 `终端shell`/`git bash`里，`Ctrl  c`键盘组合键停止运行，接着执行如下命令进行重启即可：
```shell
npm stop && node app
```

### B站推送 可选配置
自 2023 年三月起，B站风控升级，为保证旅行者们的使用体验，如果`总是`出现动态推送获取失败，可考虑配置使用自己的B站cookie增加稳定性。

目前插件已支持 *配置自定义Cookie，配置使用自己的B站cookie请在 私聊/私信 Bot下发送`#绑定B站ck: xxx`进行添加自己本地浏览器 登录b站 后获取到的B站cookie，其中`xxx`请替换为自己获取到的cookie(为降低风险，如无必要，请手动删除包含的 SESSDATA=xxxx)。

添加的cookie会自动新建并保存于`Yunzai/data/BilibiliCookie/Bili_Ck.yaml`，如需更换/更新cookie 使用新的cookie发送`#绑定B站ck: xxx`覆盖绑定即可。

* cookie的获取与设置：
1. 在浏览器中登录自己的b站账号
2. 处于bilibili首页 -> 在网页空白处右键 -> 检查（即打开开发工具） -> 找到调试台 -> 在下方输入document.cookie并回车 -> 复制给到的cookie文本
3. 私聊Bot下发送`#绑定B站ck: xxx`进行添加，提示添加成功即可愉快使用。
4. **风险选项**：如果未绑定自己b站ck而出现总是推送失败以及执行 `#删除b站临时ck` 后仍失败，并且在绑定自己的B站ck后仍失败的，最后的最后权宜之计可考虑绑定cookie时添加/保留`SESSDATA=xxxx;`，该选项如果使用自己真实的`SESSDATA`有封号的可能性特别是群人数多/推送订阅多的慎用！！目前尚且可用低风险办法请使用 `#B站ck帮助`查看。

### 微博推送
* 订阅的微博博主uid获取：找到博主主页如：(原神) https://m.weibo.cn/u/6593199887 或 (崩坏星穹铁道) https://m.weibo.cn/u/7643376782，其中的 `6593199887` 和 `7643376782` 即为相应博主的uid。
* 微博限制，可能连续获取动态会出现获取连接中断报错，待定时任务自动重试即可。
## ⌨️ 功能可用状态
* 以下可用功能QQ频道可用

- [x] B站功能
- [x] 微博功能
- [x] 米游社功能
- [x] 群战
- [x] 五子棋
- [x] 21点
- [x] 给我点颜色看看
- [x] 其他指令
- [x] 神秘指令
- [ ] 赞我/转发等小功能，请自测
- [ ] 任意功能

## ✨ 功能指令

| 命令 | 🌰 |
| --- | --- |
| 米游社功能 | ` #原神cos 角色名 ` ` #星铁cos 角色名 ` - 指定角色随机查看cos图片<br/>` #原神cos #原神cos1 #原神cos详情 ` ` #星铁cos #星铁cos1 #星铁cos详情 ` - 查看米游社中cos榜<br/>` #原神攻略 xxx ` ` #星铁攻略 xxx ` - 查询 原神 或 星铁 精选的玩家攻略内容<br/>` #原神wiki xxx ` ` #星铁wiki xxx ` - 查询 原神wiki 或 星铁百科 的内容<br/>` #原神cosdby #原神cosdby1 #原神cosdby详情 ` ` #星铁cosdby #星铁cosdby1 #星铁cosdby详情 ` - 查看米游社中大别野cos榜<br/>` #原神同人 #原神同人1 #原神同人详情 ` ` #星铁同人 #星铁同人1 #星铁同人详情 ` - 查看米游社中同人榜<br/>` #原神热门话题 ` ` #星铁热门话题 ` - 查看米游社中 原神 或 星铁 的热聊话题 |
| B站功能 | ` #订阅up推送 UID #订阅up推送 直播 UID ` - 检测up的B站动态进行推送<br/>` #取消up推送 UID #取消up推送 直播 UID ` - 删除对应up的B站对应动态推送<br/>` #推送up列表 ` - 查看本群添加的up推送列表<br/>` #手动推送up ` - 手动触发定时推送任务<br/>` #搜索up xxx ` - 根据昵称在b站搜索up<br/>` #绑定B站ck: xxx ` - (可选)若出现总是推送失败，可通过此命令为B站动态推送配置ck,仅限私聊<br/>` #我的B站ck ` - 查看配置的B站ck,仅限私聊<br/>` #删除B站ck ` - 删除已绑定的自己的B站cookie，删除后将会自动启用临时ck<br/>` #删除b站临时ck ` - 删除redis缓存的未绑定自己的B站ck而自动获取的临时B站ck，并刷新<br/>` #B站ck帮助 ` - 查看B站ck帮助 |
| 微博功能 | ` #订阅微博推送 UID #订阅微博推送 图文 UID ` - 检测博主的微博动态进行推送<br/>` #取消微博推送 UID #取消微博推送 图文 UID ` - 删除对应博主的微博对应动态推送<br/>` #推送微博列表 ` - 查看本群添加的博主推送列表<br/>` #手动推送微博 ` - 手动触发定时推送任务<br/>` #搜索博主 xxx ` - 根据昵称在微博搜索博主<br/>` #微博帮助 ` - 查看微博功能使用帮助 |
| 群战 | ` #加入群战 #群战信息 ` - 初始化群战信息<br/>` #战宝 ` - 战胜战宝获得双倍战力<br/>` 战@群友 #战@群友 ` - @一名群友进行群战<br/>` 狂战@群友 #狂战@群友 ` - 战狂(战斗次数最多)的专属技能<br/>` #逆天改命 ` - 战力最低的专属技能<br/>` #战榜 ` - 查看群战rank榜<br/>` #战狂榜 ` - 查看战斗次数排行榜<br/>` #摆烂榜 ` - 查看战力倒数排行榜 |
| 五子棋 | ` #五子棋 ` - 开局五子棋游戏<br/>` 落子+字母+数字 落子H8 ` - 五子棋落子<br/>` #弃子 ` - 五子棋认输 |
| 21点 | ` #21点 ` - 开局21点游戏<br/>` 叫牌 ` - 21点叫牌<br/>` 停牌 ` - 停止叫牌 |
| 给我点颜色看看 | ` #给我点颜色看看 ` - 开局给我点颜色看看游戏<br/>` 块+数字 ` - 选中某个不同的色块 |
| 闲心小工具 | ` #赞我 ` - QQ名片点赞<br/>` 神秘指令 ` - 情绪激动时易触发 |
| 云崽菜单辅助 | ` #任意功能 ` 如果不存在但是有类似的功能将会联想提示 |
| 其他指令 | ` #闲心插件版本 ` - 查看最近维护的版本信息<br/>` #闲心插件更新 ` - 进行更新闲心插件<br/>` #闲心插件强制更新 ` - 进行强制更新闲心插件 |


## 🖥 依赖

- [TRSS-Yunzai v3](https://gitee.com/TimeRainStarSky/Yunzai)
- 或
- [Miao-Yunzai v3](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)

## ⌨️ todo
- [x] 基本适配TRSS-Yunzai
- [ ] 偶尔维护


## 🌈 其他
- 素材来源于网络，仅供交流学习使用
- 严禁用于任何商业用途和非法行为
- 如果对你有帮助辛苦给个star，这是对我最大的鼓励


## 🔗 链接
- [@闲心 | 原版 xianxin-plugin](https://gitee.com/xianxincoder/xianxin-plugin)
- [云崽](https://gitee.com/Le-niao/Yunzai-Bot)
- [插件库](https://gitee.com/Hikari666/Yunzai-Bot-plugins-index)
