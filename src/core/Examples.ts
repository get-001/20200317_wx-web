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
    new Login(this);
  }

  init(key_data: initData) {
    this.key_data = key_data; // 写入关键信息
    this.getContactAll(); // 获取完整的通讯录数据
    new Heartbeat(
      this,
      key_data.BaseRequest,
      key_data.SyncKey,
      key_data.submit_stateUrl
    );
  }
  getContactAll() {
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
