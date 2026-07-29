import { Camera, Download, FilePlus2, Upload } from "lucide-react";
import { brandLabels, sceneTags, subjectTags } from "./data/taxonomy";
import type { CameraBrand } from "./domain/recipe";

const brands: CameraBrand[] = ["fuji", "ricoh"];

function App() {
  return (
    <main className="app-shell">
      <section className="topbar" aria-label="应用概览">
        <div>
          <p className="eyebrow">Film Recipe</p>
          <h1>相机直出配方快查笔记</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" aria-label="导入备份">
            <Upload size={18} />
          </button>
          <button type="button" aria-label="导出备份">
            <Download size={18} />
          </button>
        </div>
      </section>

      <section className="panel" aria-labelledby="brand-title">
        <div className="section-heading">
          <Camera size={18} />
          <h2 id="brand-title">先选品牌</h2>
        </div>
        <div className="brand-grid">
          {brands.map((brand) => (
            <button className="brand-card" type="button" key={brand}>
              <span>{brandLabels[brand]}</span>
              <small>{brand === "fuji" ? "X-H2 / X100V / X-E5" : "GR IIIx"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel" aria-labelledby="quick-filter-title">
        <div className="section-heading">
          <h2 id="quick-filter-title">快查筛选</h2>
        </div>
        <div className="chip-group" aria-label="场景标签">
          {sceneTags.map((tag) => (
            <button type="button" className="chip" key={tag}>
              {tag}
            </button>
          ))}
        </div>
        <div className="chip-group" aria-label="题材标签">
          {subjectTags.map((tag) => (
            <button type="button" className="chip" key={tag}>
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section className="empty-state" aria-label="配方列表">
        <FilePlus2 size={28} />
        <h2>还没有配方</h2>
        <p>下一步会接入新建配方、样张瀑布流、截图 OCR 和 JSON 备份。</p>
        <button type="button" className="primary-action">
          新建第一条配方
        </button>
      </section>
    </main>
  );
}

export default App;
