import { req } from "./tool/Req";
import { BaseRequest, SyncKey, Dynamic, initData } from "./Types";
import { Examples } from "./Examples";

/**
 * 专门用来维持微信心跳，获取信息跟状态
 * @export
 * @class Heartbeat
 */
export class Heartbeat {
  private getFormateSyncCheckKey(SyncKey) {
    const synccheckkeyList = SyncKey.List,
      synccheckkeyFormat = [];
    for (var i = 0, len = synccheckkeyList.length; i < len; i++) {
      synccheckkeyFormat.push(
        synccheckkeyList[i].Key + "_" + synccheckkeyList[i].Val
      );
    }
    return synccheckkeyFormat.join("|");
  }

  get key_data(): initData {
    return this.port_Examples.key_data;
  }
  set key_data(val: initData) {
    this.port_Examples.key_data = val;
  }

  constructor(
    private port_Examples: Examples // private _BaseRequest: BaseRequest, // private _SyncKey: SyncKey,
  ) {
    this.maintain(); // 维持心跳
  }

  private maintain() {
    const { BaseRequest, SyncKey } = this.key_data;
    req
      .http({
        url: `https://webpush.wx2.qq.com/cgi-bin/mmwebwx-bin/synccheck?r=${+new Date()}&skey=${
          BaseRequest["SKey"]
        }&sid=${BaseRequest["Sid"]}&uin=${BaseRequest["Uin"]}&deviceid=${
          BaseRequest["DeviceID"]
        }&synckey=${this.getFormateSyncCheckKey(SyncKey)}`
      })
      .then((data: any) => {
        data = data.match(
          /^window.synccheck={retcode:"([\d]+)",selector:"([\d]+)"}$/
        );
        const synccheck: { retcode: number; selector: number } = {
          retcode: parseInt(data[1]),
          selector: parseInt(data[2])
        };
        /*
         * synccheck['retcode'] : 0==正常连接 1101||1102==退出 1100 == 重载
         */
        if (synccheck["retcode"] == 0) {
          setTimeout(() => {
            this.maintain(); // 递归 - 继续监控动态
          }, 2000);
          // 正常连接 - 判断是否需要同步动态
          /*
           * synccheck["selector"]  0 -- 不需要同步动态  2 -- 有新的动态  4 -- 修改名片备注  1|5 -- 资料更新(更名)
           */
          if (synccheck["selector"] !== 0) {
            this.receiveState();
          }
        } else {
          // 连接异常 - 微信退出登陆
          this.port_Examples.onRuit(synccheck["retcode"]);
        }
      });
  }
  private receiveState() {
    const { BaseRequest, SyncKey, submit_stateUrl } = this.key_data;
    const submit_data = {
      BaseRequest: BaseRequest,
      SyncKey: SyncKey,
      rr: ~new Date()
    };
    req
      .http({
        type: "POST",
        url: submit_stateUrl,
        data: JSON.stringify(submit_data)
      })
      .then((data: string) => {
        const dynamicData: Dynamic = JSON.parse(data as string);
        this.key_data = {
          ...this.key_data,
          SyncKey: dynamicData["SyncCheckKey"]
        };
        this.port_Examples.onReceiveDynamic(dynamicData);
      });
  }
}
