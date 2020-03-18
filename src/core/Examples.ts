import { Login } from "./Login";
import {
  initData,
  BaseRequest,
  Dynamic,
  ContactAll,
  Member,
  AddMsg
} from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";
import { Tool } from "./tool";

export class Examples {
  private cachePath: string = wxConfig.cachePath;
  private _key_data?: initData;
  get key_data(): initData {
    const DeviceID = "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
    this._key_data.BaseRequest["DeviceID"] = DeviceID;
    this.key_data = this._key_data;
    return this._key_data;
  }
  set key_data(val: initData) {
    this._key_data = val;
    Tool.writeFile(
      this.cachePath + "key_data.json",
      JSON.stringify(val, null, 2)
    );
  }
  private _contactAll?: ContactAll;
  get contactAll(): ContactAll {
    return this._contactAll;
  }
  set contactAll(val: ContactAll) {
    this._contactAll = val;
    Tool.writeFile(
      this.cachePath + "contactAll.json",
      JSON.stringify(val, null, 2)
    );
  }

  constructor() {
    // 开始登录时创建缓存目录
    Tool.mkdirSync(this.cachePath);
    this.login();
  }

  login() {
    new Login(this);
  }
  onLoad(key_data: initData) {
    // 微信登录成功开始初始化
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(this);

    // setInterval(() => {
    // 消息发送测试
    // this.sendMessage("filehelper", `- 测试 ${-new Date()}`);
    // }, 15000);
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
    Tool.deletePathSync(this.cachePath); // 删除缓存目录
  }
  onReceiveDynamic(dynamicData: Dynamic) {
    // 接收新动态事件(消息)
    let dataArr = dynamicData.AddMsgList.filter(
      ({ MsgType }) => MsgType !== 51
    );
    if (dataArr.length === 0) return;
    Tool.writeFile(
      this.cachePath + "dynamic.json",
      JSON.stringify(dynamicData, null, 2)
    );
    dataArr.forEach(AddMsg => this.translateMessage(AddMsg));
  }
  translateMessage(msg: AddMsg) {
    const { User } = this.key_data;
    const { MemberList } = this.contactAll;
    let initiative = false,
      sender_name = "XXX";
    // FromUserName -- 发送人ID
    //   ToUserName -- 收信人ID
    if (User.UserName === msg.FromUserName) initiative = true;
    MemberList.some(({ UserName, RemarkName, NickName }) => {
      /*
       *   ID -- UserName
       * 备注 -- RemarkName
       * 昵称 -- NickName
       */
      const __Contact = initiative ? msg.ToUserName : msg.FromUserName;
      if (__Contact === UserName) {
        sender_name = RemarkName || NickName;
        return true;
      }
    });
    const UserPath = `${this.cachePath}/user/${sender_name}/`;
    Tool.mkdirSync(UserPath);

    console.log(initiative, ` ${msg.MsgType} `, sender_name);

    let __initiative = initiative ? "_emit" : "_collect";
    __initiative = (+new Date()).toString(36) + __initiative;

    if (msg.MsgType === 1) {
      // 文本 | 普通定位 | 群公告
      console.log(" - ", msg.Content);
      Tool.writeFile(`${UserPath}/${__initiative}.txt`, msg.Content);
    } else if (msg.MsgType === 3) {
      // 图片
      console.log("图片 - ", this.getImageUrl(msg.MsgId, true));
      req.download(
        this.getImageUrl(msg.MsgId, true),
        `${UserPath}/${__initiative}.png`
      );
    } else if (msg.MsgType === 34) {
      // 语音
      console.log("语音 - ", this.getVoiceUrl(msg.MsgId));
      req.download(
        this.getVoiceUrl(msg.MsgId),
        `${UserPath}/${__initiative}.mp3`
      );
    } else if (msg.MsgType === 43) {
      // 小视频

      console.log("小视频_封面 - ", this.getImageUrl(msg.MsgId));
      req.download(
        this.getImageUrl(msg.MsgId),
        `${UserPath}/${__initiative}.png`
      );
      console.log("小视频_地址 - ", this.getVideoUrl(msg.MsgId));
      req.download(
        this.getVideoUrl(msg.MsgId),
        `${UserPath}/${__initiative}.mp4`
      );
    } else if (msg.MsgType === 47) {
      // 表情包
    } else if (msg.MsgType === 42) {
      // 名片
    } else if (msg.MsgType === 49) {
      // 文件 | 收藏 | 链接/文章 | 发起位置共享 | 转账
    } else if (msg.MsgType === 10000) {
      // 发起群聊 | 加入群聊 | 修改群名 | 位置共享结束 | 发出红包 | 移出群聊 | 群提示
    } else if (msg.MsgType === 10002) {
      // 消息撤回
    } else {
      // 其他
      console.log(JSON.stringify(msg));
    }
  }
  getContactAll() {
    // 获取完整的通讯录数据
    const { BaseRequest } = this.key_data;
    req
      .http({
        url: `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&seq=0&SKey=${BaseRequest.SKey}`
      })
      .then((data: string) => {
        const contactAll = JSON.parse(data);
        this.contactAll = contactAll;
      });
  }
  /**
   * 发送消息
   * @param {string} toUserName 发送人ID
   * @param {string} content 需要发送的文本消息
   * @memberof Examples
   */
  sendMessage(toUserName: string, content: string) {
    const { BaseRequest, User } = this.key_data;
    const MsgId = (Date.now() + Math.random().toFixed(3)).replace(".", "");
    const submit_data = {
      BaseRequest: BaseRequest,
      Msg: {
        ClientMsgId: MsgId,
        Content: content,
        FromUserName: User.UserName,
        LocalID: MsgId,
        ToUserName: toUserName,
        Type: 1
      },
      Scene: 0
    };
    req.http({
      type: "POST",
      url: "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg",
      data: JSON.stringify(submit_data)
    });
  }
  // 获取语音
  getVoiceUrl(msgid: string) {
    const { BaseRequest } = this.key_data;
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=${msgid}&skey=${BaseRequest.SKey}`;
  }
  // 获取图片
  getImageUrl(msgid: string, artwork?: boolean) {
    const { BaseRequest } = this.key_data;
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?MsgID=${msgid}&skey=${
      BaseRequest.SKey
    }${artwork || "&type=slave"}`;
  }
  // 获取小视频
  getVideoUrl(msgid: string) {
    const { BaseRequest } = this.key_data;
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvideo?msgid=${msgid}&skey=${BaseRequest.SKey}`;
  }
}
