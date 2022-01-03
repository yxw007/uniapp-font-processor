/**
* 创建日期: 2021-08-04
* 文件名称：main.js
* 创建作者：Potter
* 开发版本：1.0.0
* 相关说明：
*/
//-------------------------------------------------------------------------
const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
//-------------------------------------------------------------------------
function clearDir(dir) {
    if (fs.existsSync(dir)) {
        let files = fs.readdirSync(dir);
        files.forEach((file, index) => {
            let filepath = path.join(dir, file);

            if (fs.statSync(filepath).isDirectory()) {
                deleteDir(filepath);
            } else {
                fs.unlinkSync(filepath);
            }
        });
    }
}
//-------------------------------------------------------------------------
function decompressZip(callback) {
    console.log("-------------------------------------------------------------------------")
    console.log("0.正在寻找最新字体zip文件,请稍等...");
    let zipDir = path.join(__dirname, "../process/zip");
    if (!fs.existsSync(zipDir)) {
        console.log("\n\n处理失败：zip 目录找不到需处理的字体图标zip文件!!!");
        return;
    }

    let zipPath = "";
    let zipDirFiles = fs.readdirSync(zipDir);
    let maxMTime = 0;
    zipDirFiles.forEach((file, index) => {
        let filePath = path.join(zipDir, file);
        let state = fs.statSync(filePath);
        if (state.mtime > maxMTime) {
            zipPath = filePath;
            maxMTime = state.mtime;
        }
    });

    if (!zipPath || zipPath.length <= 0) {
        console.log("\n\n处理失败：zip 目录找不到需处理的字体图标zip文件!!!");
        return;
    } else {
        console.log("\t最新zip文件为：" + zipPath);
    }

    let outdir = path.join(__dirname, "../process/origin/");
    clearDir(outdir);

    console.log("-------------------------------------------------------------------------")

    console.log("1.正在解压zip,请稍等...");
    fs.readFile(zipPath, function (err, data) {
        if (err) {
            console.log(`\n\n处理失败，原因：${err}`);
            return;
        };

        fs.unlinkSync(zipPath);

        var zip = new JSZip();
        zip.loadAsync(data).then(function (zip) {
            let num = Object.keys(zip.files).length;
            let index = 0;
            Object.keys(zip.files).forEach(function (filename) {
                if (!zip.files[filename].dir) {
                    zip.files[filename].async('nodebuffer').then(function (fileData) {
                        ++index;
                        var dest = outdir + path.basename(filename);
                        fs.writeFileSync(dest, fileData);
                        if (index === (num - 1)) {
                            console.log("\t解压完成!");
                            callback();
                        }
                    })
                }
            })
        });
    });
}

//-------------------------------------------------------------------------
function modifyIconfont() {
    console.log("-------------------------------------------------------------------------")
    console.log("2.修改iconfont.css,请稍等...");
    const originDir = path.join(__dirname, "../process/origin");
    const targetDir = path.join(__dirname, "../process/target");

    const cssOriginPath = path.join(originDir, "iconfont.css");
    const cssTargetPath = path.join(targetDir, "iconfont.css");
    const woff2OriginPath = path.join(originDir, "iconfont.woff");
    const woff2TargetPath = path.join(targetDir, "iconfont.woff");
    const ttfOriginPath = path.join(originDir, "iconfont.ttf");

    let content = fs.readFileSync(cssOriginPath, 'utf-8');
    const regex = /@font-face \{[\s\S]+?\}/g;
    const matchs = content.match(regex);
    if (matchs.length > 0) {
        const ttfBase64 = fs.readFileSync(ttfOriginPath, "base64");
        console.log(ttfBase64);
        const replaceContent = `@font-face {\n \tfont-family: "iconfont";\n\tsrc: url('data:application/x-font-woff2;charset=utf-8;base64,${ttfBase64}') format('woff2');\n}`;
        content = content.replace(matchs[0], replaceContent);
        fs.writeFileSync(cssTargetPath, content);
        fs.copyFileSync(woff2OriginPath, woff2TargetPath);
        console.log("\t修改文件：" + cssTargetPath);
        console.log("\t替换完毕!");
        console.log(`\n\n处理成功：请将${targetDir}目录下的iconfont.css、iconfont.woff文件copy至uniapp 字体目录即可使用~~~`);
    } else {
        console.log("\ticonfont.css 匹配内容失败！");
    }
}
//-------------------------------------------------------------------------
(function start() {
    console.log("-------------------------------------------------------------------------")
    console.log("=====欢迎使用自动处理阿里巴巴矢量图标库工具=====");
    decompressZip(modifyIconfont);
})();
//-------------------------------------------------------------------------
