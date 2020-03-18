import fs from "fs";

export class Tool {
  // 对路径进行分级解析
  private static parsePath(path: string) {
    let pathSplit: string[] = path.split("/");
    pathSplit[0] === "." && pathSplit.shift();
    let pathAdd = ".";
    pathSplit = pathSplit.filter(p => p);
    pathSplit = pathSplit.map(p => {
      pathAdd += `/${p}`;
      return pathAdd;
    });
    return pathSplit;
  }

  /**
   * 枚举目录
   * @static
   * @param {string} path
   * @param {*} [pathArr=[]]
   * @returns {string[]}
   * @memberof Tool
   */
  static readdirSync(path: string): string[] {
    const pathArr = [],
      filePathArr = fs.readdirSync(path);
    filePathArr.forEach(filePath => {
      filePath = path + "/" + filePath;
      if (fs.lstatSync(filePath).isDirectory()) {
        // 目录
        const arr = this.readdirSync(filePath);
        pathArr.push({ type: "dir", path: filePath, children: arr });
      } else {
        // 文件
        pathArr.push({ type: "file", path: filePath });
      }
    });
    return pathArr;
  }
  /**
   * 删除目录/文件
   * @static
   * @param {string} path 目录路径
   * @memberof Tool
   */
  static deletePathSync(path: string): boolean {
    if (!fs.existsSync(path)) {
      // 没有这个路径
      return true;
    } else if (fs.lstatSync(path).isFile()) {
      // 路径是文件类型
      fs.unlinkSync(path);
      return !fs.existsSync(path);
    }
    let pathArr = this.readdirSync(path);
    pathArr.forEach(filePath => {
      if (filePath["children"]) {
        this.deletePathSync(filePath["path"]);
      } else {
        fs.unlinkSync(filePath["path"]);
      }
    });
    fs.rmdirSync(path);
    return !fs.existsSync(path);
  }
  /**
   * 创建目录
   * @static
   * @param {string} path
   * @returns
   * @memberof Tool
   */
  static mkdirSync(path: string) {
    this.parsePath(path).forEach(p => fs.existsSync(p) || fs.mkdirSync(p));
    return fs.existsSync(path);
  }
  static writeFile(
    path: string,
    content: string,
    callback: fs.NoParamCallback = () => {}
  ) {
    fs.writeFile(path, content, callback); // 写入到文件
  }
}
