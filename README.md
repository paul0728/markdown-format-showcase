# Markdown 格式展示器

一個簡單的 GitHub Pages 網頁應用程式，用於解析和展示 JSON 中的 Markdown 字串。

## 功能特色

- ✨ 即時解析 Markdown 字串
- 📝 支援 JSON 跳脫字元（如 `\n`、`\t` 等）
- 🎨 現代化深色主題設計
- 📱 響應式佈局，支援各種裝置
- 📊 完整支援 GFM（GitHub Flavored Markdown）表格
- ⌨️ 支援 Ctrl+Enter 快捷鍵解析
- 🔄 即時預覽功能

## 使用方式

1. 直接開啟 `index.html` 檔案
2. 或者部署到 GitHub Pages

### 部署到 GitHub Pages

1. 將此專案推送到 GitHub repository
2. 前往 Repository Settings → Pages
3. 在 Source 選擇 `main` 分支
4. 儲存後等待部署完成

## 範例輸入

```
# 穿黃色衣服的人影像報告\n\n## 特約永和中正門市影像資料\n在特約永和中正門市中，穿著黃色衣服的顧客影像如下：\n\n| 影像來源 | 影像鏈接 |\n| -------- | -------- |\n| ECC100-特約竹東長春二-櫃台Camera | 影像1 |
```

## 技術棧

- HTML5
- CSS3 (現代化設計系統)
- JavaScript (ES6+)
- [Marked.js](https://github.com/markedjs/marked) - Markdown 解析器

## 授權

MIT License
