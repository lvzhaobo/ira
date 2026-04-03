import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    title: "投研智能",
    desc: "研报问答、个股覆盖与多 Agent 编排演示，贴合机构工作流。",
    to: "/login?next=/research-qa-change",
    link: "进入研报问答",
  },
  {
    title: "合规与可追溯",
    desc: "合规扫描、数据血缘与审计线索，关键操作带 trace 展示。",
    to: "/login?next=/compliance",
    link: "合规扫描",
  },
  {
    title: "舆情与报告",
    desc: "舆情看板、报告登记与系统设置，支持 Workshop 扩展联调。",
    to: "/login?next=/sentiment",
    link: "舆情监控",
  },
];

// Hero 轮播图片配置
const HERO_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop",
    title: "投研智能工作台",
    subtitle: "面向基金与资管团队的统一入口",
    description: "问答、合规、血缘、舆情与报告流转，一站式投研解决方案",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop",
    title: "智能数据分析",
    subtitle: "AI 驱动的投研决策支持",
    description: "多智能体协同，深度研报解析，实时市场洞察",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop",
    title: "合规与风控",
    subtitle: "全方位合规保障",
    description: "合规扫描、数据血缘与审计线索，确保每一步都可追溯",
  },
];

const AUTOPLAY_INTERVAL = 5000; // 5秒自动切换

export default function Landing() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 自动轮播
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  return (
    <div className="ira-landing-full">
      {/* Hero 区域 - 100% 宽度 */}
      <section className="ira-landing-hero-full" aria-labelledby="hero-title">
        <div className="ira-landing-hero__slider">
          {/* 图片轮播 */}
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className={`ira-landing-hero__slide ${index === currentSlide ? "active" : ""}`}
            >
              <img src={slide.image} alt={slide.title} className="ira-landing-hero__image" />
              <div className="ira-landing-hero__overlay" />
            </div>
          ))}

          {/* 内容覆盖层 */}
          <div className="ira-landing-hero__content">
            <div className="ira-landing-hero__container">
              <p className="ira-landing-hero__eyebrow">IRA Workshop · 内部演示环境</p>
              <h1 id="hero-title" className="ira-landing-hero__title">
                {HERO_SLIDES[currentSlide].title}
              </h1>
              <p className="ira-landing-hero__subtitle">
                {HERO_SLIDES[currentSlide].subtitle}
              </p>
              <p className="ira-landing-hero__lead">
                {HERO_SLIDES[currentSlide].description}
              </p>
              <div className="ira-landing-hero__actions">
                <Link to="/login?next=/workbench" className="ira-landing-btn ira-landing-btn--primary">
                  进入工作台
                </Link>
                <Link to="/login?next=/settings" className="ira-landing-btn ira-landing-btn--ghost">
                  系统与 OpenAPI
                </Link>
              </div>
            </div>
          </div>

          {/* 轮播控制 */}
          <button
            className="ira-landing-hero__nav ira-landing-hero__nav--prev"
            onClick={prevSlide}
            aria-label="上一张"
          >
            ‹
          </button>
          <button
            className="ira-landing-hero__nav ira-landing-hero__nav--next"
            onClick={nextSlide}
            aria-label="下一张"
          >
            ›
          </button>

          {/* 指示器 */}
          <div className="ira-landing-hero__indicators">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                className={`ira-landing-hero__indicator ${index === currentSlide ? "active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`第 ${index + 1} 张`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 特性区域 - 100% 宽度 */}
      <section className="ira-landing-features-full" aria-label="能力概览">
        <div className="ira-landing-features__container">
          <h2 className="ira-landing-features__heading">能力概览</h2>
          <ul className="ira-landing-features__grid">
            {FEATURES.map((f) => (
              <li key={f.title} className="ira-landing-card">
                <h3 className="ira-landing-card__title">{f.title}</h3>
                <p className="ira-landing-card__desc">{f.desc}</p>
                <Link to={f.to} className="ira-landing-card__link">
                  {f.link} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
