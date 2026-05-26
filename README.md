# map-icon-plot

浏览器端库：**加载 SVG → 按规则修改 DOM 属性 → 栅格化为 `HTMLCanvasElement`**。

适用于地图标注、图例、面板图标等需要在运行时动态改色、改描边、缩放的场景。不绑定任何 UI 框架或地图 SDK。

| 特性 | 说明 |
|------|------|
| 零依赖 | 仅使用 `DOMParser`、`fetch` / `XHR`、`Canvas 2D` |
| 声明式规则 | CSS 选择器 + 属性映射，可自定义 `SvgStyleRules` |
| 内置默认规则 | `applyDefaultMapIconStyle` 覆盖常见矢量标签 |
| 双加载方式 | `fetch` 或 `XMLHttpRequest` |
| 输出 | `HTMLCanvasElement` 或 PNG Data URL |

**运行环境**：现代浏览器（不支持 Node 无 DOM 环境栅格化）。

---

## 安装

```bash
npm install map-icon-plot
```

```js
// ESM
import { rasterizeMapIconFromUrl } from "map-icon-plot";

// CommonJS
const { rasterizeMapIconFromUrl } = require("map-icon-plot");
```

---

## 核心流程

```
SVG 来源                    样式处理                      输出
─────────                  ─────────                    ──────
URL / 字符串  →  Document  →  applySvgStyleRules  →  svgDocumentToCanvas  →  Canvas
                parse/load      (或内置默认规则)         (Blob + Image)
```

**一站式函数**（`rasterize*`）将加载、着色、栅格化合并为一次 `async` 调用。

---

## 类型

### `SvgStyleInput`

```ts
type SvgStyleInput = Record<string, unknown>;
```

传给规则引擎的样式数据。规则里以 `$.` 开头的字符串会从该对象按路径取值。

---

### `SvgStyleRules`

声明式规则：描述「选中哪些元素、写入哪些 SVG 属性」。

```ts
interface SvgStyleRules {
  version?: number;
  rootScale?: RootScaleConfig;
  layers: SvgStyleLayerRule[];
}

interface SvgStyleLayerRule {
  select: string;                      // 相对根 <svg> 的 CSS 选择器
  map: Record<string, string>;         // 属性名 → 字面量或 "$.字段路径"
}

interface RootScaleConfig {
  mode: "svgWidthHeight" | "none";
  field?: string;        // 从 SvgStyleInput 读取缩放值的键，默认 "scale"
  defaultValue?: number; // 无效或未提供时的默认倍数，默认 1
}
```

| 字段 | 含义 |
|------|------|
| `layers` | 按顺序执行；后序规则覆盖同一元素同一属性 |
| `rootScale.mode: "svgWidthHeight"` | 将根 `<svg>` 的 `width` / `height`（像素）乘以 `input[field]` |
| `rootScale.mode: "none"` | 不修改根尺寸 |
| `layer.select` | 如 `path`、`rect`、`[data-role="fill"]` |
| `layer.map` | 键为 SVG 属性（建议 kebab-case，如 `stroke-width`）；值为字面量或 `$.fill`、`$.theme.primary` |

**模板语法**：`map` 中的值若以 `$.` 开头，表示从 `SvgStyleInput` 取值；否则作为固定字符串写入属性。

---

### `RasterizeOptions`

栅格化选项，用于 `svgDocumentToCanvas` 及所有 `rasterize*` 函数。

| 参数 | 类型 | 默认 | 含义 |
|------|------|------|------|
| `pixelRatio` | `number` | `1` | 画布像素尺寸 = SVG 解码尺寸 × 该值；绘制前对 context 做 `scale` |
| `backgroundColor` | `string` | — | 绘制 SVG 前的画布背景色（CSS 颜色） |
| `revokeBlobUrls` | `boolean` | `true` | 完成后是否 `URL.revokeObjectURL` 内部创建的 Blob URL |

---

### `LoadSvgOptions`

继承标准 `RequestInit`，额外字段：

| 参数 | 类型 | 含义 |
|------|------|------|
| `baseUrl` | `string` | 预留，当前版本未参与 URL 解析 |

用于 `loadSvgFromUrl`、`rasterizeMapIconFromUrl` 等的 `fetchInit` 选项。

---

### `MapPlotIconStyleLike`

高层便捷样式对象，供 `mapPlotStyleToSvgInput` 及 `rasterizeMapPlotIcon*` 使用。

| 参数 | 类型 | 含义 |
|------|------|------|
| `color` | `string` | 主填充色；若未提供 `fill` 则映射为 `fill` |
| `fill` | `string` | 显式填充色，优先级高于 `color` |
| `border` | `boolean` | `false` 时描边宽度为 `0` |
| `borderColor` | `string` | 描边颜色 |
| `borderWidth` | `number` | 描边宽度（像素），默认 `1` |
| `scale` | `number` | 根 SVG 缩放倍数，默认 `1` |

---

## API 参考

以下按功能分组。除注明外，修改 DOM 的函数均为**原地修改**传入的 `Document`。

---

### `resolveTemplate(template, input)`

解析规则 `map` 中的单个模板字符串。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `template` | `string` | 模板：以 `$.` 开头则从 `input` 取值，否则视为字面量 |
| `input` | `SvgStyleInput` | 样式数据对象 |

**返回值**：`string`

**行为**

- `$.a.b`：沿路径取值后 `String()`；中间路径无效或叶子为 `null`/`undefined` 时返回 `""`
- 非 `$.` 开头：原样返回 `template`

**示例**

```ts
import { resolveTemplate } from "map-icon-plot";

resolveTemplate("$.fill", { fill: "#3366cc" });  // "#3366cc"
resolveTemplate("2px", { fill: "#000" });          // "2px"
resolveTemplate("$.missing", {});                  // ""
```

---

### `cloneSvgDocument(doc)`

深克隆 SVG 文档，便于保留原始 DOM 副本。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `doc` | `Document` | 已解析的 SVG 文档 |

**返回值**：新的 `Document`（`cloneNode(true)`）

**示例**

```ts
import { parseSvgString, cloneSvgDocument, applySvgStyleRules } from "map-icon-plot";

const original = parseSvgString(svgString);
const working = cloneSvgDocument(original);
applySvgStyleRules(working, rules, input);
// original 未被修改
```

---

### `applySvgStyleRules(doc, rules, input)`

按 `SvgStyleRules` 修改 SVG 文档。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `doc` | `Document` | 根节点须为 `<svg>` |
| `rules` | `SvgStyleRules` | 声明式规则 |
| `input` | `SvgStyleInput` | 样式数据，供 `$.` 模板取值 |

**返回值**：`void`

**行为**

1. 根节点不是 `<svg>` 时抛出 `Error`
2. 按 `rootScale` 配置缩放根元素尺寸（若启用）
3. 依次处理 `layers`：对每个 `select` 匹配的元素设置 `map` 中的属性
4. 若某 `select` 语法非法，该 layer 被跳过（不抛错）
5. 模板以 `$.` 开头且解析为空字符串时，**不设置**该属性

**示例**

```ts
import { parseSvgString, applySvgStyleRules, svgDocumentToCanvas } from "map-icon-plot";

const rules = {
  rootScale: { mode: "svgWidthHeight", field: "scale", defaultValue: 1 },
  layers: [
    {
      select: "path, rect",
      map: {
        fill: "$.fill",
        stroke: "$.stroke",
        "stroke-width": "$.strokeWidth",
      },
    },
  ],
};

const doc = parseSvgString('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">...</svg>');
applySvgStyleRules(doc, rules, {
  fill: "#e74c3c",
  stroke: "#2c3e50",
  strokeWidth: "2px",
  scale: 1.5,
});
const canvas = await svgDocumentToCanvas(doc);
```

---

### `applyDefaultMapIconStyle(doc, input)`

使用库内置默认规则调用 `applySvgStyleRules`（原地修改）。

**内置规则概要**

- 根缩放：`svgWidthHeight`，字段 `scale`，默认 `1`
- 选择器：`path, rect, circle, ellipse, polygon, polyline`
- 属性映射：`fill` ← `$.fill`，`stroke` ← `$.stroke`，`stroke-width` ← `$.strokeWidth`

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `doc` | `Document` | SVG 文档 |
| `input` | `SvgStyleInput` | 通常包含 `fill`、`stroke`、`strokeWidth`、`scale` |

**返回值**：`void`

**示例**

```ts
import { parseSvgString, applyDefaultMapIconStyle, svgDocumentToCanvas } from "map-icon-plot";

const doc = parseSvgString(svgMarkup);
applyDefaultMapIconStyle(doc, {
  fill: "#3498db",
  stroke: "#ffffff",
  strokeWidth: "1px",
  scale: 2,
});
const canvas = await svgDocumentToCanvas(doc, { pixelRatio: 2 });
```

---

### `serializeSvgDocument(doc)`

将 SVG 文档序列化为 XML 字符串。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `doc` | `Document` | SVG 文档 |

**返回值**：`string`（根 `<svg>` 的序列化结果）

**示例**

```ts
import { serializeSvgDocument } from "map-icon-plot";

const xml = serializeSvgDocument(doc);
const blob = new Blob([xml], { type: "image/svg+xml" });
```

---

### `parseSvgString(svgMarkup)`

从字符串解析 SVG。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `svgMarkup` | `string` | 完整 SVG XML |

**返回值**：`Document`

**异常**

- 根节点不是 `<svg>`
- 解析失败（`parsererror` 节点存在）

**示例**

```ts
import { parseSvgString, applyDefaultMapIconStyle, svgDocumentToCanvas } from "map-icon-plot";

const doc = parseSvgString(`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="20" fill="#999" stroke="#333" stroke-width="2"/>
  </svg>
`);
applyDefaultMapIconStyle(doc, { fill: "#2ecc71", stroke: "#27ae60", strokeWidth: "2px", scale: 1 });
const canvas = await svgDocumentToCanvas(doc);
```

---

### `loadSvgFromUrl(url, init?)`

通过 `fetch` 加载 SVG 并解析为文档。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 资源地址（绝对或相对当前页面的 URL） |
| `init` | `LoadSvgOptions` | 可选，传给 `fetch` 的配置（`method`、`headers`、`credentials` 等） |

**返回值**：`Promise<Document>`

**异常**：HTTP 状态非 2xx 时抛出 `Error`

**示例**

```ts
import { loadSvgFromUrl, applyDefaultMapIconStyle, svgDocumentToCanvas } from "map-icon-plot";

const doc = await loadSvgFromUrl("https://example.com/icons/pin.svg", {
  credentials: "same-origin",
});
applyDefaultMapIconStyle(doc, { fill: "#f39c12", stroke: "#000", strokeWidth: "0", scale: 1 });
const canvas = await svgDocumentToCanvas(doc);
```

> 跨域资源需服务端返回 CORS 头；否则请使用同源 URL、`loadSvgFromXhr`，或 `parseSvgString` 内联 SVG。

---

### `loadSvgFromXhr(url, mimeType?)`

通过 `XMLHttpRequest` 加载 SVG。

**参数**

| 名称 | 类型 | 默认 | 含义 |
|------|------|------|------|
| `url` | `string` | — | SVG 地址 |
| `mimeType` | `string` | `"image/svg+xml"` | `overrideMimeType` 使用的 MIME |

**返回值**：`Promise<Document>`

**行为**

- `responseType: "document"`，优先使用 `responseXML`
- 若 XML 根不是 `<svg>`，回退为 `responseText` + `parseSvgString`
- 状态码非 2xx 或网络错误时 `reject`

**示例**

```ts
import { loadSvgFromXhr, applyDefaultMapIconStyle, svgDocumentToCanvas } from "map-icon-plot";

const doc = await loadSvgFromXhr("/assets/marker.svg");
applyDefaultMapIconStyle(doc, { fill: "#9b59b6", stroke: "#fff", strokeWidth: "2px", scale: 1.2 });
const canvas = await svgDocumentToCanvas(doc);
```

---

### `svgDocumentToCanvas(doc, options?)`

将已着色的 SVG 文档栅格化为 Canvas。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `doc` | `Document` | SVG 文档 |
| `options` | `RasterizeOptions` | 栅格化选项，见上文类型表 |

**返回值**：`Promise<HTMLCanvasElement>`

**实现要点**：序列化 → Blob URL → `Image` 解码 → `Canvas 2D` 绘制；默认自动释放 Blob URL。

**示例**

```ts
import { parseSvgString, applyDefaultMapIconStyle, svgDocumentToCanvas } from "map-icon-plot";

const doc = parseSvgString(svgString);
applyDefaultMapIconStyle(doc, { fill: "#1abc9c", stroke: "#16a085", strokeWidth: "1px", scale: 1 });
const canvas = await svgDocumentToCanvas(doc, {
  pixelRatio: window.devicePixelRatio || 1,
  backgroundColor: "transparent",
});
document.body.appendChild(canvas);
```

---

### `canvasToPngDataUrl(canvas, quality?)`

将 Canvas 转为 PNG Data URL。

**参数**

| 名称 | 类型 | 默认 | 含义 |
|------|------|------|------|
| `canvas` | `HTMLCanvasElement` | — | 源画布 |
| `quality` | `number` | — | PNG 质量参数，传给 `toDataURL` 第二参数（若环境支持） |

**返回值**：`string`（`data:image/png;base64,...`）

**示例**

```ts
import { svgDocumentToCanvas, canvasToPngDataUrl } from "map-icon-plot";

const canvas = await svgDocumentToCanvas(doc);
const dataUrl = canvasToPngDataUrl(canvas);

const img = new Image();
img.src = dataUrl;
// 或: <img src={dataUrl} /> 、作为 CSS background-image 等
```

---

### `mapPlotStyleToSvgInput(style)`

将 `MapPlotIconStyleLike` 转为内置默认规则所需的 `SvgStyleInput`。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `style` | `MapPlotIconStyleLike` | 便捷样式对象 |

**返回值**：`SvgStyleInput`

**映射关系**

| 输出字段 | 计算方式 |
|----------|----------|
| `fill` | `style.fill ?? style.color ?? "#ff0000"` |
| `stroke` | `style.borderColor ?? "#ffffff"` |
| `strokeWidth` | `border === false` → `"0"`，否则 `` `${borderWidth ?? 1}px` `` |
| `scale` | `style.scale ?? 1` |

**示例**

```ts
import { mapPlotStyleToSvgInput, applyDefaultMapIconStyle, parseSvgString } from "map-icon-plot";

const input = mapPlotStyleToSvgInput({
  color: "#e67e22",
  border: true,
  borderColor: "#2c3e50",
  borderWidth: 3,
  scale: 1.5,
});
// { fill: "#e67e22", stroke: "#2c3e50", strokeWidth: "3px", scale: 1.5 }

const doc = parseSvgString(svgString);
applyDefaultMapIconStyle(doc, input);
```

---

### `rasterizeMapIconFromUrl(url, input, options?)`

**一站式**：`fetch` 加载 → 内置默认规则着色 → 栅格化。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `input` | `SvgStyleInput` | 传给默认规则的样式（`fill`、`stroke`、`strokeWidth`、`scale` 等） |
| `options` | `RasterizeOptions & { fetchInit?: LoadSvgOptions }` | 栅格化选项；`fetchInit` 传给 `loadSvgFromUrl` |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeMapIconFromUrl } from "map-icon-plot";

const canvas = await rasterizeMapIconFromUrl("/icons/marker.svg", {
  fill: "#c0392b",
  stroke: "#ecf0f1",
  strokeWidth: "2px",
  scale: 1,
}, {
  pixelRatio: 2,
  fetchInit: { cache: "force-cache" },
});
```

---

### `rasterizeMapIconFromXhr(url, input, options?)`

与 `rasterizeMapIconFromUrl` 相同，但使用 `loadSvgFromXhr` 加载。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `input` | `SvgStyleInput` | 样式数据 |
| `options` | `RasterizeOptions` | 栅格化选项 |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeMapIconFromXhr } from "map-icon-plot";

const canvas = await rasterizeMapIconFromXhr("https://cdn.example.com/icon.svg", {
  fill: "rgba(52, 152, 219, 0.9)",
  stroke: "#2980b9",
  strokeWidth: "1px",
  scale: 2,
});
```

---

### `rasterizeMapPlotIconFromUrl(url, style, options?)`

在 `rasterizeMapIconFromUrl` 基础上，接受 `MapPlotIconStyleLike`，内部经 `mapPlotStyleToSvgInput` 转换。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `style` | `MapPlotIconStyleLike` | 便捷样式对象 |
| `options` | `RasterizeOptions & { fetchInit?: LoadSvgOptions }` | 栅格化与 fetch 选项 |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeMapPlotIconFromUrl, canvasToPngDataUrl } from "map-icon-plot";

const canvas = await rasterizeMapPlotIconFromUrl("/icons/pin.svg", {
  color: "#d35400",
  border: false,
  scale: 1.25,
});
const pngUrl = canvasToPngDataUrl(canvas);
```

---

### `rasterizeMapPlotIconFromXhr(url, style, options?)`

与 `rasterizeMapPlotIconFromUrl` 相同，使用 XHR 加载。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `style` | `MapPlotIconStyleLike` | 便捷样式对象 |
| `options` | `RasterizeOptions` | 栅格化选项 |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeMapPlotIconFromXhr } from "map-icon-plot";

const canvas = await rasterizeMapPlotIconFromXhr("/static/symbols/unit.svg", {
  color: "#8e44ad",
  border: true,
  borderColor: "#ffffff",
  borderWidth: 2,
  scale: 1,
});
```

---

### `rasterizeStyledSvgFromUrl(url, rules, input, options?)`

**一站式（自定义规则）**：`fetch` 加载 → `applySvgStyleRules` → 栅格化。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `rules` | `SvgStyleRules` | 自定义规则 |
| `input` | `SvgStyleInput` | 样式数据 |
| `options` | `RasterizeOptions & { fetchInit?: LoadSvgOptions }` | 栅格化与 fetch 选项 |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeStyledSvgFromUrl } from "map-icon-plot";

const rules = {
  rootScale: { mode: "svgWidthHeight", field: "scale" },
  layers: [
    { select: "path", map: { fill: "$.primary", stroke: "$.outline", "stroke-width": "$.outlineWidth" } },
    { select: "[data-part='badge']", map: { fill: "$.accent" } },
  ],
};

const canvas = await rasterizeStyledSvgFromUrl("/icons/badge-marker.svg", rules, {
  primary: "#2980b9",
  outline: "#1a5276",
  outlineWidth: "2px",
  accent: "#f1c40f",
  scale: 1.2,
});
```

---

### `rasterizeStyledSvgFromXhr(url, rules, input, options?)`

与 `rasterizeStyledSvgFromUrl` 相同，使用 XHR 加载。

**参数**

| 名称 | 类型 | 含义 |
|------|------|------|
| `url` | `string` | SVG 地址 |
| `rules` | `SvgStyleRules` | 自定义规则 |
| `input` | `SvgStyleInput` | 样式数据 |
| `options` | `RasterizeOptions` | 栅格化选项 |

**返回值**：`Promise<HTMLCanvasElement>`

**示例**

```ts
import { rasterizeStyledSvgFromXhr } from "map-icon-plot";

const canvas = await rasterizeStyledSvgFromXhr("/icons/layered.svg", customRules, {
  fill: "#27ae60",
  stroke: "#1e8449",
  strokeWidth: "0",
  scale: 0.8,
});
```

---

## 使用场景示例

### 场景 A：内联 SVG，完全手动流水线

```ts
import {
  parseSvgString,
  applySvgStyleRules,
  svgDocumentToCanvas,
} from "map-icon-plot";

const doc = parseSvgString(svgFromYourApp);
applySvgStyleRules(doc, yourRules, yourStyleInput);
const canvas = await svgDocumentToCanvas(doc, { pixelRatio: 2 });
```

### 场景 B：远程 SVG + 默认着色（最少代码）

```ts
import { rasterizeMapIconFromUrl } from "map-icon-plot";

const canvas = await rasterizeMapIconFromUrl(iconUrl, {
  fill: userColor,
  stroke: userStroke,
  strokeWidth: userBorderOn ? "2px" : "0",
  scale: userScale,
});
```

### 场景 C：远程 SVG + 便捷样式字段

```ts
import { rasterizeMapPlotIconFromUrl } from "map-icon-plot";

const canvas = await rasterizeMapPlotIconFromUrl(iconUrl, {
  color: "#3498db",
  border: true,
  borderColor: "#2c3e50",
  borderWidth: 1,
  scale: 1.5,
});
```

### 场景 D：导出为图片 URL 供 `<img>` 使用

```ts
import { rasterizeMapIconFromUrl, canvasToPngDataUrl } from "map-icon-plot";

const canvas = await rasterizeMapIconFromUrl(iconUrl, styleInput);
const src = canvasToPngDataUrl(canvas);
```

---

## 导出列表

**函数**：`resolveTemplate`、`cloneSvgDocument`、`applySvgStyleRules`、`applyDefaultMapIconStyle`、`serializeSvgDocument`、`parseSvgString`、`loadSvgFromUrl`、`loadSvgFromXhr`、`svgDocumentToCanvas`、`canvasToPngDataUrl`、`mapPlotStyleToSvgInput`、`rasterizeMapIconFromUrl`、`rasterizeMapIconFromXhr`、`rasterizeMapPlotIconFromUrl`、`rasterizeMapPlotIconFromXhr`、`rasterizeStyledSvgFromUrl`、`rasterizeStyledSvgFromXhr`

**类型**：`SvgStyleInput`、`SvgStyleRules`、`SvgStyleLayerRule`、`RootScaleConfig`、`RootScaleMode`、`RasterizeOptions`、`LoadSvgOptions`、`MapPlotIconStyleLike`

---

## 交互 Demo

包内提供浏览器 Demo（需 HTTP 服务，勿用 `file://` 直接打开）：

```bash
# 在仓库根目录
npm run demo

# 或
cd demo && npx serve . -p 5178
```

访问 `http://localhost:5178`（需先 `npm run build` 生成 `dist/`）。可切换内联 SVG、URL 加载、自定义规则三种模式。

---

## 注意事项

1. **跨域**：`loadSvgFromUrl` 及基于 `fetch` 的 `rasterize*` 要求资源允许跨域；否则使用同源地址、`loadSvgFromXhr`，或 `parseSvgString`。
2. **内存**：默认 `revokeBlobUrls: true`；若设为 `false`，需自行调用 `URL.revokeObjectURL`。
3. **高清显示**：高 DPI 屏幕建议设置 `pixelRatio: window.devicePixelRatio`。
4. **持久化**：`HTMLCanvasElement` 无法 JSON 序列化；持久化建议只存 SVG 路径/内容与样式参数，展示时再调用本库重新生成。
5. **安全**：不可信来源的 SVG 应在业务层做消毒（移除 `script`、事件属性、外部引用等）。

---

## License

MIT
