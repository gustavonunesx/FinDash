"use client";

import {
  Suspense,
  useState,
  useTransition,
  useEffect,
  useRef,
  createContext,
  useContext,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, useSpring } from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Check, Star } from "lucide-react";
import confetti from "canvas-confetti";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { IconSparkles, IconArrowRight } from "@tabler/icons-react";

// ── dados dos planos ──────────────────────────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Gratuito",
    description: "Para começar a organizar as finanças sem compromisso.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Criar conta grátis",
    ctaHref: "/cadastro",
    isCheckout: false,
    popular: false,
    features: [
      "Dashboard completo",
      "Até 10 gastos por mês",
      "Até 3 fundos financeiros",
      "Calculadora 50/30/20",
      "Score financeiro",
      "Sem cartão de crédito",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "O parceiro financeiro de longo prazo. Histórico, relatórios e muito mais.",
    monthlyPrice: 19,
    yearlyPrice: 149,
    cta: "Testar 14 dias grátis",
    ctaHref: null,
    isCheckout: true,
    popular: true,
    features: [
      "Tudo do plano Gratuito",
      "Gastos e fundos ilimitados",
      "Histórico mensal com gráficos",
      "Exportação de relatório PDF",
      "Plano Família (até 3 membros)",
      "Cancele quando quiser",
    ],
  },
  {
    id: "familia",
    name: "Família",
    description: "Finanças em família. Compartilhe metas e acompanhe todos juntos.",
    monthlyPrice: 29,
    yearlyPrice: 239,
    cta: "Em breve",
    ctaHref: null,
    isCheckout: false,
    popular: false,
    features: [
      "Tudo do plano Premium",
      "Até 5 membros por família",
      "Fundos compartilhados",
      "Score por membro",
      "Metas financeiras em grupo",
      "Prioridade no suporte",
    ],
  },
];

// ── contexto do toggle ────────────────────────────────────────────────────────
const PricingCtx = createContext<{
  isYearly: boolean;
  setIsYearly: (v: boolean) => void;
}>({ isYearly: false, setIsYearly: () => {} });

// ── estrela individual com spring magnético ───────────────────────────────────
function MagneticStar({
  mouse,
  containerRef,
}: {
  mouse: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [pos] = useState({
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
  });
  const cfg = { stiffness: 100, damping: 15, mass: 0.1 };
  const sx = useSpring(0, cfg);
  const sy = useSpring(0, cfg);

  useEffect(() => {
    if (!containerRef.current || mouse.x === null || mouse.y === null) {
      sx.set(0); sy.set(0); return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const starX = rect.left + (parseFloat(pos.left) / 100) * rect.width;
    const starY = rect.top + (parseFloat(pos.top) / 100) * rect.height;
    const dx = mouse.x - starX, dy = mouse.y - starY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const radius = 500;
    if (dist < radius) {
      const f = 1 - dist / radius;
      sx.set(dx * f * 0.45);
      sy.set(dy * f * 0.45);
    } else { sx.set(0); sy.set(0); }
  }, [mouse, pos, containerRef, sx, sy]);

  return (
    <motion.div
      className="absolute rounded-full bg-foreground/60"
      style={{
        top: pos.top, left: pos.left,
        width: `${1 + Math.random() * 1.8}px`,
        height: `${1 + Math.random() * 1.8}px`,
        x: sx, y: sy,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.7, 0] }}
      transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
    />
  );
}

function Starfield({
  mouse,
  containerRef,
}: {
  mouse: { x: number | null; y: number | null };
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 120 }).map((_, i) => (
        <MagneticStar key={i} mouse={mouse} containerRef={containerRef} />
      ))}
    </div>
  );
}

// ── toggle mensal / anual ─────────────────────────────────────────────────────
function PricingToggle() {
  const { isYearly, setIsYearly } = useContext(PricingCtx);
  const monthlyRef = useRef<HTMLButtonElement>(null);
  const annualRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState<React.CSSProperties>({});

  useEffect(() => {
    const btn = isYearly ? annualRef.current : monthlyRef.current;
    if (btn) setPill({ width: btn.offsetWidth, transform: `translateX(${btn.offsetLeft}px)` });
  }, [isYearly]);

  function toggle(yearly: boolean) {
    if (isYearly === yearly) return;
    setIsYearly(yearly);
    if (yearly && annualRef.current) {
      const r = annualRef.current.getBoundingClientRect();
      confetti({
        particleCount: 70,
        spread: 75,
        origin: {
          x: (r.left + r.width / 2) / window.innerWidth,
          y: (r.top + r.height / 2) / window.innerHeight,
        },
        colors: ["#1d9e75", "#378add", "#7c5cbf", "#e8923a"],
        ticks: 260,
        gravity: 1.1,
        decay: 0.93,
        startVelocity: 28,
      });
    }
  }

  return (
    <div className="flex justify-center">
      <div className="relative flex w-fit items-center rounded-full bg-card border border-border/60 p-1">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-primary shadow-lg shadow-primary/30"
          style={pill}
          transition={{ type: "spring", stiffness: 500, damping: 38 }}
        />
        <button
          ref={monthlyRef}
          onClick={() => toggle(false)}
          className={cn(
            "relative z-10 rounded-full px-5 py-2 text-sm font-medium transition-colors",
            !isYearly ? "text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mensal
        </button>
        <button
          ref={annualRef}
          onClick={() => toggle(true)}
          className={cn(
            "relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
            isYearly ? "text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Anual
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            isYearly ? "bg-white/20 text-white" : "bg-primary/15 text-primary"
          )}>
            -35%
          </span>
        </button>
      </div>
    </div>
  );
}

// ── card individual ───────────────────────────────────────────────────────────
function PricingCard({
  plan,
  index,
  onCheckout,
  pending,
}: {
  plan: (typeof plans)[0];
  index: number;
  onCheckout: () => void;
  pending: boolean;
}) {
  const { isYearly } = useContext(PricingCtx);
  const price = isYearly ? plan.monthlyPrice === 0 ? 0 : plan.yearlyPrice : plan.monthlyPrice;
  const isFree = plan.monthlyPrice === 0;
  const isComingSoon = plan.id === "familia";

  const isPopular = plan.popular;
  const padding = isPopular ? "p-9" : "p-6";
  const priceSize = isPopular ? "text-6xl" : "text-4xl";
  const prefixSize = isPopular ? "text-2xl" : "text-lg";
  const nameSize = isPopular ? "text-xl" : "text-base";
  const featureText = isPopular ? "text-sm" : "text-xs";

  return (
    <motion.div
      initial={{ y: 48, opacity: 0, filter: "blur(8px)" }}
      whileInView={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 110,
        damping: 22,
        delay: index * 0.13,
      }}
      className={cn(
        "relative flex flex-col rounded-2xl bg-card/80 backdrop-blur-sm transition-all duration-300",
        padding,
        isPopular
          ? "border-2 border-primary shadow-2xl shadow-primary/20 z-10"
          : plan.id === "familia"
            ? "border border-fd-blue/40"
            : "border border-border/60",
        isComingSoon && "opacity-70"
      )}
    >
      {/* badge popular flutuante */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 shadow-lg shadow-primary/40">
            <Star className="h-3.5 w-3.5 fill-white text-white" />
            <span className="text-xs font-bold text-white">Mais popular</span>
          </div>
        </div>
      )}
      {isComingSoon && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-fd-blue/40 bg-card px-4 py-1.5">
            <span className="text-xs font-bold text-fd-blue">Em breve</span>
          </div>
        </div>
      )}

      {/* glow interno */}
      {isPopular && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(29,158,117,0.12),transparent)]" />
      )}

      <div className="flex flex-1 flex-col text-center">
        {/* nome */}
        <h3 className={cn("font-semibold text-foreground", nameSize)}>{plan.name}</h3>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
          {plan.description}
        </p>

        {/* preço */}
        <div className={cn("mt-5 flex items-baseline justify-center gap-1")}>
          {isFree ? (
            <span className={cn("font-mono font-black tracking-tighter text-foreground", priceSize)}>
              R$0
            </span>
          ) : (
            <>
              <span className={cn("font-mono font-bold text-muted-foreground self-end mb-1", prefixSize)}>
                R$
              </span>
              <NumberFlow
                value={price}
                className={cn("font-mono font-black tracking-tighter text-foreground", priceSize)}
              />
            </>
          )}
          <span className="self-end mb-1.5 text-xs text-muted-foreground">
            {isFree ? "/sempre" : isYearly ? "/ano" : "/mês"}
          </span>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground/60">
          {isFree ? "sem cartão de crédito" : isYearly ? "cobrado anualmente" : "cobrado mensalmente"}
        </p>

        {/* features */}
        <ul className={cn("mt-6 space-y-2 text-left", isPopular && "mt-7 space-y-2.5")}>
          {plan.features.map((f) => (
            <li key={f} className={cn("flex items-start gap-2.5", featureText, "text-muted-foreground")}>
              <Check
                className={cn(
                  "mt-0.5 shrink-0",
                  isPopular ? "h-4 w-4 text-primary" : "h-3.5 w-3.5",
                  plan.id === "familia" ? "text-fd-blue" : !isPopular && "text-muted-foreground/50"
                )}
              />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto pt-6">
          {plan.isCheckout ? (
            <button
              onClick={onCheckout}
              disabled={pending}
              className="relative w-full overflow-hidden rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-60 group"
            >
              <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full pointer-events-none"
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.7 }}
              />
              <span className="relative inline-flex items-center justify-center gap-2">
                {pending ? "Redirecionando..." : plan.cta}
                {!pending && <IconArrowRight size={14} />}
              </span>
            </button>
          ) : plan.ctaHref ? (
            <Link
              href={plan.ctaHref}
              className="block w-full rounded-xl border border-border/70 py-3 text-center text-sm font-bold transition-all duration-200 hover:border-foreground/20 hover:bg-secondary/60"
            >
              {plan.cta}
            </Link>
          ) : (
            <button
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-border/50 py-3 text-sm font-bold text-muted-foreground opacity-40"
            >
              {plan.cta}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── toast checkout cancelado ──────────────────────────────────────────────────
function CheckoutToastPrecos() {
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    if (searchParams.get("checkout") === "cancel") {
      toast.info("Checkout cancelado. Você continua no plano Free.");
      router.replace("/precos", { scroll: false });
    }
  }, [searchParams, router]);
  return null;
}

// ── página ────────────────────────────────────────────────────────────────────
export default function PrecosPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });

  function handleCheckout() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ yearly: isYearly }),
        });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else toast.error(data.error ?? "Configure Stripe para checkout");
      } catch {
        toast.error("Erro ao iniciar checkout");
      }
    });
  }

  return (
    <PricingCtx.Provider value={{ isYearly, setIsYearly }}>
      <div className="min-h-screen bg-background">
        <Suspense fallback={null}>
          <CheckoutToastPrecos />
        </Suspense>

        {/* ── header ── */}
        <header className="sticky top-0 z-50 border-b border-border/40 glass">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="font-mono text-lg font-black text-primary tracking-tight">
              Fin<span className="text-foreground">Dash</span>
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 pt-20 pb-32">

          {/* ── hero textual ── */}
          <article className="mb-14 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-xs font-semibold text-primary">
              <IconSparkles size={12} />
              Planos simples
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              <VerticalCutReveal
                splitBy="words"
                staggerDuration={0.12}
                staggerFrom="first"
                containerClassName="flex-wrap gap-x-3"
                transition={{ type: "spring", stiffness: 260, damping: 38, delay: 0 }}
              >
                Plano certo para cada momento financeiro
              </VerticalCutReveal>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-sm text-muted-foreground md:text-base"
            >
              Comece grátis, evolua quando quiser. Sem letras miúdas, sem surpresas.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <PricingToggle />
            </motion.div>
          </article>

          {/* ── grid de cards com starfield ── */}
          <div
            ref={containerRef}
            className="relative"
            onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setMouse({ x: null, y: null })}
          >
            <Starfield mouse={mouse} containerRef={containerRef as React.RefObject<HTMLDivElement>} />

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 pt-8 md:grid-cols-3">
              {plans.map((plan, i) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  index={i}
                  onCheckout={handleCheckout}
                  pending={pending}
                />
              ))}
            </div>
          </div>

          {/* ── rodapé ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-16 text-center text-xs text-muted-foreground/50"
          >
            Todos os planos pagos incluem 14 dias de teste grátis. Cancele quando quiser, sem cobrança.
          </motion.p>
        </main>
      </div>
    </PricingCtx.Provider>
  );
}
