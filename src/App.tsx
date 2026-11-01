/** App — tek sayfa: arka plan, header, bölümler, footer. */
import { BackToTop } from "@/components/layout/BackToTop";
import { Background } from "@/components/layout/Background";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Apps } from "@/components/sections/Apps";
import { Contact } from "@/components/sections/Contact";
import { Hero } from "@/components/sections/Hero";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { sections } from "@/config/site";
import { ThemeSwitcher } from "@/components/ui/apple-liquid-glass-switcher";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useTheme } from "@/hooks/useTheme";

const SECTION_IDS = sections.map((s) => s.id);

export default function App() {
  const active = useActiveSection(SECTION_IDS);
  const [theme, setTheme] = useTheme();
  return (
    <>
      <a
        href="#icerik"
        className="glass-pill fixed top-3 left-3 z-[60] -translate-y-24 focus-visible:translate-y-0"
      >
        İçeriğe geç
      </a>
      <Background />
      <Header active={active} />
      <main id="icerik" tabIndex={-1} className="outline-none">
        <Hero />
        <Apps />
        <HowItWorks />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
      {/* tema seçici: açık / koyu / loş */}
      <div className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6">
        <ThemeSwitcher value={theme} onValueChange={setTheme} />
      </div>
    </>
  );
}
