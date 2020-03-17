import fs from "fs";
import { Login } from "./Login";
import { initData, BaseRequest } from "./Types";
import wxConfig from "./wxConfig";
import { req } from "./tool/Req";
import { Heartbeat } from "./Heartbeat";

export class Examples {
  private cachePath: string = wxConfig.cachePath;
  private writeFile(path: string, content: string) {
    fs.writeFile(path, content, () => {}); // 写入到文件
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
  private _contactAll?;
  get contactAll(): object {
    return this._contactAll;
  }
  set contactAll(val: object) {
    this._contactAll = val;
    this.writeFile(
      this.cachePath + "contactAll.json",
      JSON.stringify(val, null, 2)
    );
  }

  constructor() {
    // 开始登录时创建缓存目录
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
  }
  onRuit(statusCode) {
    // 退出登录时清空缓存目录
    console.log(statusCode, " -- 微信退出登陆");
  }
  onReceiveDynamic(data: object) {
    // 接收新动态事件(消息)
    console.log(
      data["AddMsgList"].length,
      data["AddMsgList"].map(({ MsgType }) => MsgType)
    );
    // 51
    const arr = data["AddMsgList"].filter(({ MsgType }) => MsgType != 51);
    if (arr.length !== 0) {
      this.writeFile(
        this.cachePath + "dynamic.json",
        JSON.stringify(data, null, 2)
      );
    }
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
        this.contactAll = JSON.parse(data);
      });
  }
}
