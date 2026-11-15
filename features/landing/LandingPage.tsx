import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "../../components/Brand";
import { Icon, type IconName } from "../../components/Icon";

export type Audience = "client" | "provider";

interface Content {
  role: string;
  eyebrow: string;
  title: ReactNode;
  intro: string;
  primary: string;
  secondary: string;
  imageTitle: string;
  imageCategory: string;
  imageDescription: string;
  steps: readonly (readonly [string, string, string])[];
  featureTitle: string;
  featureCopy: string;
  calloutTitle: string;
  calloutCopy: string;
}

const content: Record<Audience, Content> = {
  client: {
    role: "Cliente",
    eyebrow: "SERVIÇOS LOCAIS, SEM COMPLICAÇÃO",
    title: <>Encontre quem resolve.<br /><em>Mais perto de si.</em></>,
    intro: "Explore serviços, compare preços e contrate profissionais para as tarefas que fazem parte do seu dia a dia.",
    primary: "Encontrar um serviço",
    secondary: "Quero prestar serviços",
    imageTitle: "Canalização",
    imageCategory: "Casa",
    imageDescription: "Reparações e manutenção para a sua casa.",
    steps: [
      ["01", "Explore", "Pesquise por serviço ou escolha uma categoria."],
      ["02", "Compare", "Veja a descrição e o preço antes de decidir."],
      ["03", "Contrate", "Confirme o serviço e acompanhe a atividade na sua conta."],
    ],
    featureTitle: "Tudo começa com o que precisa.",
    featureCopy: "Encontre opções para casa, beleza, tecnologia, educação, saúde, eventos e automóvel. A informação do serviço fica clara antes de contratar.",
    calloutTitle: "O próximo passo é simples.",
    calloutCopy: "Crie a sua conta para descobrir serviços e gerir as suas contratações num só lugar.",
  },
  provider: {
    role: "Prestador",
    eyebrow: "O SEU TRABALHO MERECE SER ENCONTRADO",
    title: <>Mostre o que sabe fazer.<br /><em>Encontre novos clientes.</em></>,
    intro: "Apresente os seus serviços, defina os seus preços e acompanhe as contratações e os movimentos da sua carteira.",
    primary: "Criar conta de prestador",
    secondary: "Explorar como cliente",
    imageTitle: "Os meus serviços",
    imageCategory: "O seu perfil profissional",
    imageDescription: "Publique o que faz e mantenha os seus serviços atualizados.",
    steps: [
      ["01", "Crie o seu perfil", "Registe-se como prestador para começar."],
      ["02", "Publique serviços", "Adicione categoria, descrição e preço."],
      ["03", "Acompanhe", "Consulte contratações, carteira e histórico."],
    ],
    featureTitle: "O seu trabalho, bem apresentado.",
    featureCopy: "Organize os serviços numa página própria, atualize os detalhes quando precisar e acompanhe a atividade a partir da sua conta.",
    calloutTitle: "Pronto para começar?",
    calloutCopy: "Crie o seu perfil e publique os serviços que quer disponibilizar na plataforma.",
  },
};

const categories: readonly (readonly [IconName, string])[] = [
  ["home_repair_service", "Casa"],
  ["face", "Beleza"],
  ["devices", "Tecnologia"],
  ["school", "Educação"],
  ["health_and_safety", "Saúde"],
  ["event", "Eventos"],
  ["directions_car", "Automóvel"],
];

function ArrowLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return <Link className={className} href={href}>{children}<Icon name="arrow_outward" /></Link>;
}

export function LandingPage({ audience = "client" }: { audience?: Audience }) {
  const current = content[audience];
  const isClient = audience !== "provider";
  const oppositeHref = isClient ? "/prestador" : "/cliente";
  const signupHref = `/app?mode=register&role=${isClient ? "CLIENT" : "PROVIDER"}`;

  return (
    <main className="landing-page">
      <header className="landing-header landing-container">
        <Link href="/" aria-label="Bulir, página inicial"><Brand small /></Link>
        <nav className="landing-nav" aria-label="Navegação principal">
          <Link href="/cliente" className={isClient ? "current" : ""}>Cliente</Link>
          <Link href="/prestador" className={!isClient ? "current" : ""}>Prestador</Link>
          <a href="#como-funciona">Como funciona</a>
        </nav>
        <div className="landing-header-actions">
          <Link className="landing-login" href="/app">Entrar</Link>
          <Link className="landing-button landing-button-dark landing-header-cta" href={signupHref}>Criar conta</Link>
        </div>
      </header>

      <section className="landing-hero landing-container">
        <div className="landing-hero-copy">
          <span className="landing-eyebrow"><i />{current.eyebrow}</span>
          <h1>{current.title}</h1>
          <p>{current.intro}</p>
          <div className="landing-hero-actions">
            <Link className="landing-button landing-button-dark" href={signupHref}>{current.primary}<Icon name="arrow_forward" /></Link>
            <ArrowLink className="landing-text-link" href={oppositeHref}>{current.secondary}</ArrowLink>
          </div>
          <div className="landing-hero-note"><Icon name="check_circle" /> Uma plataforma para clientes e prestadores em Angola</div>
        </div>
        <div className={`landing-preview landing-preview-${audience}`} aria-label="Pré-visualização da plataforma">
          <div className="landing-preview-glow" />
          <div className="landing-preview-card">
            <div className="landing-preview-top"><span className="landing-preview-mark"><Icon name={isClient ? "search" : "home_repair_service"} /></span><span className="landing-preview-dots">•••</span></div>
            <span className="landing-preview-overline">{current.imageCategory}</span>
            <h2>{current.imageTitle}</h2>
            <p>{current.imageDescription}</p>
            <div className="landing-preview-divider" />
            <div className="landing-preview-meta"><span><Icon name="location_on" /> Luanda</span><span><Icon name="schedule" /> Disponível</span></div>
            <div className="landing-preview-bottom"><span>{isClient ? "A partir de" : "Perfil profissional"}<b>{isClient ? "Ver preço" : "Gerir serviços"}</b></span><span className="landing-preview-arrow"><Icon name="arrow_forward" /></span></div>
          </div>
          <div className="landing-float landing-float-one"><span className="landing-float-icon"><Icon name={isClient ? "account_balance_wallet" : "notifications"} /></span><span><b>{isClient ? "A sua carteira" : "Acompanhe a atividade"}</b><small>{isClient ? "Saldo e movimentos num só lugar" : "Serviços e carteira na sua conta"}</small></span></div>
          <div className="landing-float landing-float-two"><span className="landing-float-check"><Icon name="check" /></span><span><b>{isClient ? "Preço à vista" : "Serviço publicado"}</b><small>{isClient ? "Consulte antes de contratar" : "Pronto para ser encontrado"}</small></span></div>
          <span className="landing-preview-caption">Pré-visualização do Bulir</span>
        </div>
      </section>

      <section className="landing-proof landing-container" aria-label="Resumo da plataforma">
        <div><span className="landing-proof-icon"><Icon name="search" /></span><p><b>Explore</b><small>Serviços por categoria</small></p></div>
        <div><span className="landing-proof-icon"><Icon name="payments" /></span><p><b>Consulte</b><small>Preços apresentados</small></p></div>
        <div><span className="landing-proof-icon"><Icon name="account_balance_wallet" /></span><p><b>Acompanhe</b><small>Carteira e histórico</small></p></div>
      </section>

      <section className="landing-how" id="como-funciona">
        <div className="landing-container">
          <div className="landing-section-heading"><span className="landing-eyebrow">SEM COMPLICAÇÕES</span><h2>Um caminho claro<br /><em>do início ao próximo passo.</em></h2><p>O Bulir organiza a experiência para cada lado da contratação.</p></div>
          <div className="landing-steps">{current.steps.map(([number, title, description]) => <article className="landing-step" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p><i /></article>)}</div>
        </div>
      </section>

      <section className="landing-discover landing-container">
        <div className="landing-discover-copy"><span className="landing-eyebrow">{isClient ? "ENCONTRE O QUE PRECISA" : "DÊ VISIBILIDADE AO SEU TRABALHO"}</span><h2>{current.featureTitle}</h2><p>{current.featureCopy}</p><ArrowLink className="landing-inline-link" href={signupHref}>{isClient ? "Explorar serviços" : "Começar como prestador"}</ArrowLink></div>
        {isClient ? <div className="landing-category-panel"><div className="landing-panel-heading"><span>Categorias</span><span>Encontre um serviço <Icon name="arrow_forward" /></span></div><div className="landing-categories">{categories.map(([icon, label]) => <Link key={label} href={signupHref}><span><Icon name={icon} /></span>{label}<Icon name="chevron_right" /></Link>)}</div></div> : <div className="landing-provider-panel"><span className="landing-provider-label"><Icon name="account_circle" /> O seu espaço de trabalho</span><h3>Uma conta para gerir a sua atividade.</h3><div className="landing-provider-list"><span><Icon name="home_repair_service" /> Serviços publicados <b>Organize</b></span><span><Icon name="account_balance_wallet" /> Carteira <b>Acompanhe</b></span><span><Icon name="history" /> Histórico <b>Consulte</b></span></div><Link href={signupHref}>Criar perfil de prestador <Icon name="arrow_forward" /></Link></div>}
      </section>

      <section className="landing-faq">
        <div className="landing-container landing-faq-inner">
          <div className="landing-faq-heading"><span className="landing-eyebrow">PERGUNTAS FREQUENTES</span><h2>Ficou com dúvidas?</h2><p>Comece com o essencial e explore a plataforma quando estiver pronto.</p></div>
          <div className="landing-faq-list">
            <details><summary>Como começo a usar o Bulir?<Icon name="keyboard_arrow_down" /></summary><p>Crie uma conta como cliente ou prestador. Depois, aceda à sua área para explorar serviços ou publicar os seus.</p></details>
            <details><summary>Posso usar a plataforma como cliente e prestador?<Icon name="keyboard_arrow_down" /></summary><p>Escolha o tipo de conta ao criar o perfil. Pode conhecer as duas experiências através das páginas Cliente e Prestador.</p></details>
            <details><summary>Onde acompanho os serviços e a carteira?<Icon name="keyboard_arrow_down" /></summary><p>Depois de entrar, a sua área reúne as opções disponíveis para o seu perfil, incluindo serviços, carteira e histórico.</p></details>
          </div>
        </div>
      </section>

      <section className="landing-switch-section">
        <div className="landing-container landing-switch-inner"><div><span className="landing-eyebrow">UMA PLATAFORMA, DOIS CAMINHOS</span><h2>{isClient ? "Também presta serviços?" : "Está à procura de um serviço?"}</h2><p>{isClient ? "Apresente o seu trabalho e alcance clientes que procuram profissionais." : "Explore serviços e encontre opções para as suas necessidades."}</p></div><Link className="landing-button landing-button-outline" href={oppositeHref}>{isClient ? "Conhecer o espaço do prestador" : "Conhecer o espaço do cliente"}<Icon name="arrow_forward" /></Link></div>
      </section>

      <section className="landing-cta landing-container"><div className="landing-cta-panel"><div><span className="landing-eyebrow">BULIR</span><h2>{current.calloutTitle}</h2><p>{current.calloutCopy}</p></div><Link className="landing-button landing-button-dark" href={signupHref}>{isClient ? "Criar conta de cliente" : "Criar conta de prestador"}<Icon name="arrow_forward" /></Link><span className="landing-cta-orb" /></div></section>

      <footer className="landing-footer"><div className="landing-container landing-footer-inner"><Link href="/" aria-label="Bulir"><Brand small /></Link><span>Serviços locais, ligações que fazem sentido.</span><div><Link href="/cliente">Cliente</Link><Link href="/prestador">Prestador</Link><Link href="/app">Entrar</Link></div><small>© {new Date().getFullYear()} Bulir</small></div></footer>
    </main>
  );
}
