<p align="center">
  <a href="https://gitee.com/snowtafir/xianxin-plugin">
    <img width="200" src="https://gitee.com/snowtafir/xianxin-plugin/raw/main/resources/img/rank/top.png">
  </a>
</p>

<h1 align="center">trss-xianxin-plugin</h1>

<div align="center">

<a href="https://gitee.com/TimeRainStarSky/Yunzai" target="_blank">TRSS-Yunzai</a> 的关于B站推送、微博推送、原神cos、wiki查询和群战等功能的扩展插件。

[![访问量](https://profile-counter.glitch.me/trss-xianxin-plugin/count.svg)](https://gitee.com/snowtafir/xianxin-plugin)

</div>

* 基于 [闲心插件/xianxin-plugin](https://gitee.com/xianxincoder/xianxin-plugin) 维护的trss分支。
* 当前适配：TRSS-Yunzai、Miao-Yunzai

## 📦 一、安装与更新与配置

1. 推荐使用 git 进行安装，以方便后续升级。在`Yunzai`根目录打开 `终端shell`/`git bash`，运行如下命令（根据网络情况选择 GitHub 或 Gitee ）进行安装：

> Gitee：

```shell
git clone https://gitee.com/snowtafir/xianxin-plugin.git ./plugins/trss-xianxin-plugin/
```
> Github：
```shell
git clone https://github.com/snowtafir/xianxin-plugin.git ./plugins/trss-xianxin-plugin/
```
2. 接着在bot目录或插件目录下执行依赖安装即可：
```
pnpm i
```

3. 后续更新可通过 `#闲心插件更新` 进行，或者在`Yunzai/plugins/trss-xianxin-plugin/`目录下打开 `终端shell`/`git bash`执行：
```shell
git pull
```
* 接着在`Yunzai`根目录已经打开的运行着的 `终端shell`/`git bash`里，`Ctrl  c`键盘组合键停止运行，接着执行如下命令进行重启即可：
```shell
npm stop && node app
```
> 如果是下载压缩包到本地，解压后把插件文件夹重命名为`trss-xianxin-plugin`放到`Yunzai/plugins/`下即可（该方式不能使用`#闲心插件更新`或git方式更新插件）。

### （一）B站推送 配置
自 2023 年三月起，B站风控升级，为保证旅行者们的使用体验，使用前需要执行如下配置一个或多个。风控后执行如下某个配置后，如果仍出现风控，请30min+后再尝试动态推送添加等指令操作，度过风控期。

<font color=#F98DC7>**cookie使用优先级：**</font> <font color= #00c4b6> **手动绑定** ＞ 扫码登录 ＞ ***临时ck***。</font>

#### 1.二维码登录B站(推荐)
> `#扫码B站登录`，获取B站登录cookie并缓存到redis并使用。取消登录则发送：`#删除B站登录`

#### 2.刷新b站临时ck(推荐)
> 未配置使用自己的B站cookie时将会使用临时ck，当旧临时ck也出现风控时，可通过发送 `#刷新b站临时ck`命令进行ck刷新，刷新完请等待bot重启刷新状态以应用更改，如果刷新报错，请重启bot（手动重启或`#重启`）后重试。`风控问题报错频繁：当前或需要每2天执行一次该命令。`

#### 3.增加动态监测间隔时长(推荐)
B站的api风控是一套复杂机制，针对ip而不针对账号,风控的检测区间为10min，风控的持续时常为30min。

> 修改`Yunzai/plugins/trss-xianxin-plugin/config/bilibili.set.yaml`配置项`pushTime`的值为如下示例值或其他值：
```yaml
"*/15  * * * *" #每15min检测一次
"*/31  * * * *" #每31min检测一次
"0 5,35 * * * *" #每小时固定第5分0秒、第35分0秒检测一次，共2次/h
"0 5,35,51 * * * *" #每小时固定第5分0秒、第35分0秒、第51分0秒检测一次，共3次/h
```

#### 4.手动 配置/绑定 自定义Cookie(可选)
> 配置使用自己的B站cookie请在 私聊/私信 Bot下发送`#绑定B站ck: xxx`进行添加自己本地浏览器 登录b站 后获取到的B站cookie，其中`xxx`请替换为自己获取到的cookie(注：包含的 `SESSDATA=xxxx;`值代表使用 完整的`个人B站登录ck`)。

> 添加的cookie会自动新建并保存于`Yunzai/data/BilibiliCookie/Bili_Ck.yaml`，如需更换/更新cookie 使用新的cookie发送`#绑定B站ck: xxx`覆盖绑定即可。

* **cookie的获取与设置：**

> 1. 在浏览器中登录自己的b站账号
> 2. 处于bilibili首页 -> 在网页空白处右键 -> 检查（即打开开发工具） -> 找到调试台 -> 在下方输入document.cookie并回车 -> 复制给到的cookie文本
> 3. 私聊Bot下发送`#绑定B站ck: xxx`进行添加，提示添加成功即可愉快使用。 

#### 5.设备挂机B站客户端(推荐)
> 运行bot的设备或局域网内的设备，后台挂机正在使用的登录了自己B站账号的B站app端或web端(浏览器)，可以降低风控概率。

### （二）微博推送配置
* 订阅的微博博主uid获取：
> 1. 找到博主主页如：(原神) https://m.weibo.cn/u/6593199887 或 (崩坏星穹铁道) https://m.weibo.cn/u/7643376782，其中的 `6593199887` 和 `7643376782` 即为相应博主的uid。
> 
> 2. 打开微博app，进入博主主页，右上角点击分享，复制分享链接，在链接里找到相应uid。
* 微博限制，可能连续获取动态会出现获取连接中断报错，待定时任务自动重试即可。
## ⌨️ 二、功能可用状态
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

## ✨ 三、功能指令

| 功能 | 🌰 指令 |
| --- | --- |
| 米游社功能 | ` #原神cos 角色名 ` ` #星铁cos 角色名 ` - 指定角色随机查看cos图片<br/>` #原神cos #原神cos1 #原神cos详情 ` ` #星铁cos #星铁cos1 #星铁cos详情 ` - 查看米游社中cos榜<br/>` #原神攻略 xxx ` ` #星铁攻略 xxx ` - 查询 原神 或 星铁 精选的玩家攻略内容<br/>` #原神wiki xxx ` ` #星铁wiki xxx ` - 查询 原神wiki 或 星铁百科 的内容<br/>` #原神cosdby #原神cosdby1 #原神cosdby详情 ` ` #星铁cosdby #星铁cosdby1 #星铁cosdby详情 ` - 查看米游社中大别野cos榜<br/>` #原神同人 #原神同人1 #原神同人详情 ` ` #星铁同人 #星铁同人1 #星铁同人详情 ` - 查看米游社中同人榜<br/>` #原神热门话题 ` ` #星铁热门话题 ` - 查看米游社中 原神 或 星铁 的热聊话题 |
| B站功能 | ` #订阅up推送 UID #订阅up推送 直播 UID ` - 检测up的B站动态进行推送<br/>` #取消up推送 UID #取消up推送 直播 UID ` - 删除对应up的B站对应动态推送<br/>` #推送up列表 ` - 查看本群添加的up推送列表<br/>` #手动推送up ` - 手动触发定时推送任务<br/>` #搜索up xxx ` - 根据昵称在b站搜索up<br/>` #绑定B站ck: xxx ` - (可选)若出现总是推送失败，可通过此命令为B站动态推送配置ck,仅限私聊<br/>` #我的B站ck ` - 查看当前启用的B站ck,仅限私聊<br/>` #扫码b站登陆 ` - 扫码登陆B站获取B站登陆ck<br/>` #删除B站ck ` - 删除手动获取并绑定的B站cookie，将会自动启用临时ck<br/>` #删除b站登陆 ` - 删除缓存的扫码登陆ck，删除后将自动启用临时B站ck<br/>` #刷新b站临时ck ` - 重新获取并刷新redis缓存的未绑定自己的B站ck而自动获取的临时B站ck，该操作成功后将会自动重启bot刷新状态，如果失败或卡住可手动重启bot后重试<br/>` #B站ck帮助 ` - 查看B站ck帮助 |
| 微博功能 | ` #订阅微博推送 UID #订阅微博推送 图文 UID ` - 检测博主的微博动态进行推送<br/>` #取消微博推送 UID #取消微博推送 图文 UID ` - 删除对应博主的微博对应动态推送<br/>` #推送微博列表 ` - 查看本群添加的博主推送列表<br/>` #手动推送微博 ` - 手动触发定时推送任务<br/>` #搜索博主 xxx ` - 根据昵称在微博搜索博主<br/>` #微博帮助 ` - 查看微博功能使用帮助 |
| 群战 | ` #加入群战 #群战信息 ` - 初始化群战信息<br/>` #战宝 ` - 战胜战宝获得双倍战力<br/>` 战@群友 #战@群友 ` - @一名群友进行群战<br/>` 狂战@群友 #狂战@群友 ` - 战狂(战斗次数最多)的专属技能<br/>` #逆天改命 ` - 战力最低的专属技能<br/>` #战榜 ` - 查看群战rank榜<br/>` #战狂榜 ` - 查看战斗次数排行榜<br/>` #摆烂榜 ` - 查看战力倒数排行榜 |
| 五子棋 | ` #五子棋 ` - 开局五子棋游戏<br/>` 落子+字母+数字 落子H8 ` - 五子棋落子<br/>` #弃子 ` - 五子棋认输 |
| 21点 | ` #21点 ` - 开局21点游戏<br/>` 叫牌 ` - 21点叫牌<br/>` 停牌 ` - 停止叫牌 |
| 给我点颜色看看 | ` #给我点颜色看看 ` - 开局给我点颜色看看游戏<br/>` 块+数字 ` - 选中某个不同的色块 |
| 闲心小工具 | ` #赞我 ` - QQ名片点赞<br/>` 神秘指令 ` - 情绪激动时易触发 |
| 云崽菜单辅助 | ` #任意功能 ` 如果不存在但是有类似的功能将会联想提示 |
| 其他指令 | ` #闲心插件版本 ` - 查看最近维护的版本信息<br/>` #闲心插件更新 ` - 进行更新闲心插件<br/>` #闲心插件强制更新 ` - 进行强制更新闲心插件 |

## ⌨️ todo
- [ ] 偶尔维护

## 🌈 其他
- 素材来源于网络，仅供交流学习使用
- 严禁用于任何商业用途和非法行为
- 如果对你有帮助辛苦给个star，这是对我最大的鼓励


## 🔗 链接

|                           Nickname                                 | Contribution            |
| :----------------------------------------------------------------: | ----------------------- |
| [功能/插件库](https://gitee.com/yhArcadia/Yunzai-Bot-plugins-index) | Yunzai-Bot 相关内容索引  |
| [TRSS-Yunzai](https://gitee.com/TimeRainStarSky/Yunzai)            | 时雨🌌星空的 TRSS-Yunzai |
| [Miao-Yunzai](https://gitee.com/yoimiya-kokomi/Miao-Yunzai)        | 喵喵的 Miao-Yunzai       |
| [Yunzai-Bot](https://gitee.com/Le-niao/Yunzai-Bot)                 | 乐神的 Yunzai-Bot        |