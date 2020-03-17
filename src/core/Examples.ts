import fs from "fs";
import { Login } from "./Login";
import { initData, BaseRequest, Dynamic, ContactAll, Member } from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";

export class Examples {
  private cachePath: string = wxConfig.cachePath;
  private writeFile(path: string, content: string) {
    fs.writeFile(path, content, () => {}); // 写入到文件
  }
  public get DeviceID(): string {
    return "e" + ("" + Math.random().toFixed(15)).substring(2, 17);
  }
  private _key_data?: initData;
  get key_data(): initData {
    return this._key_data;
  }
  set key_data(val: initData) {
    this._key_data = val;
    this.writeFile(
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
    this.writeFile(
      this.cachePath + "contactAll.json",
      JSON.stringify(val, null, 2)
    );
  }

  constructor() {
    // 开始登录时创建缓存目录
    fs.existsSync(this.cachePath) || fs.mkdirSync(this.cachePath);
    this.login();
  }

  login() {
    new Login(this);
  }
  onLoad(key_data: initData) {
    // 微信登录成功开始初始化
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(
      this,
      key_data.BaseRequest,
      key_data.SyncKey,
      key_data.submit_stateUrl
    );

    setInterval(() => {
      // 消息发送测试
      // this.sendMessage("filehelper", `- 测试 ${-new Date()}`);
      this.loginout();
    }, 15000);
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
  }
  onReceiveDynamic(dynamicData: Dynamic) {
    // 接收新动态事件(消息)
    let dataArr = dynamicData.AddMsgList.filter(
      ({ MsgType }) => MsgType !== 51
    );
    if (dataArr.length === 0) return;

    // -------------------------------------------------------------
    const MemberList: Member[] = this.contactAll.MemberList;
    dataArr = dataArr.map(({ MsgType, ToUserName, Content }) => {
      let NickName = "";
      MemberList.forEach(member => {
        if (ToUserName === member.UserName) NickName = member.NickName;
      });
      return { MsgType, ToUserName, NickName, Content };
    }) as [];
    console.log(JSON.stringify(dataArr));
    // -------------------------------------------------------------

    this.writeFile(
      this.cachePath + "dynamic.json",
      JSON.stringify(dynamicData, null, 2)
    );
  }
  getContactAll() {
    // 获取完整的通讯录数据
    const {
      BaseRequest: { SKey }
    } = this.key_data;
    req
      .http({
        url: `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&seq=0&SKey=${SKey}`
      })
      .then((data: string) => {
        const contactAll = JSON.parse(data);
        this.contactAll = contactAll;
      });
  }
  sendMessage(toUserName: string, content: string) {
    const { BaseRequest } = this.key_data;
    BaseRequest.DeviceID = this.DeviceID;
    this.key_data = { ...this.key_data, BaseRequest };
    const MsgId = (Date.now() + Math.random().toFixed(3)).replace(".", "");
    const submit_data = {
      BaseRequest: BaseRequest,
      Msg: {
        ClientMsgId: MsgId,
        Content: content,
        FromUserName: this.key_data.User.UserName,
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
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetvoice?msgid=${msgid}&skey=${this.key_data.BaseRequest.SKey}`;
  }
  // 获取图片
  getImageUrl(msgid: string, artwork: boolean = true) {
    return `https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetmsgimg?MsgID=${msgid}&skey=${
      this.key_data.BaseRequest.SKey
    }${artwork && "&type=slave"}`;
  }
  loginout() {
    console.log("xxxxxxxxxxxxxxxxxxxxxxx");
    const { BaseRequest } = this.key_data;
    BaseRequest.DeviceID = this.DeviceID;
    req.http({
      type: "POST",
      url:
        "https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxstatreport?fun=new&lang=zh_CN",
      data: JSON.stringify({
        BaseRequest: BaseRequest,
        Count: 1,
        List:
          '[{"Type":1,"Text":"{"type":"[session-data]","data":{"uin":1785889460,"browser":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 UBrowser/6.2.4098.3 Safari/537.36","rmsg":0,"rconv":0,"smsg":0,"sconv":0,"lifetime":100357}}"}]'
      })
    });
  }
}
