"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { allPages, api, json, UNAUTHORIZED_EVENT } from "../../core/api";
import { uploadImage } from "../../core/images";
import {
  createService,
  imageAuthorization,
  removeService,
  updateService,
} from "../../core/services";
import { toService, toTransaction, toUser } from "../../core/adapters";
import { categories, money } from "../../core/format";
import {
  playNotificationSound,
  unlockNotificationSound,
} from "../../core/notification-sound";
import { Brand, Icon } from "../../core/ui";
import Auth from "../auth/Auth";
import ServiceForm from "./ServiceForm";
import SettingsPage from "../settings/SettingsPage";
import {
  Empty,
  FilterSelect,
  MobileNav,
  Pagination,
  ServiceCard,
  ServiceImage,
  TransactionTable,
} from "./components";

const subscribeToNothing = () => () => {};

function App() {
  const [language, setLanguage] = useState(() =>
    typeof window !== "undefined" &&
    window.localStorage.getItem("presta-ja.language") === "en"
      ? "en"
      : "pt",
  );
  const [preferences, setPreferences] = useState({
    notifications: true,
    confirmHire: true,
  });
  const [cards, setCards] = useState([]);
  const [user, setUser] = useState(null);
  const initialized = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [page, setPage] = useState("home");
  const [services, setServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("relevance");
  const [category, setCategory] = useState("Todos");
  // Serviço em edição (null = a criar um novo) e a chave que reinicia o formulário.
  const [editingService, setEditingService] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(null);
  // A imagem já enviada: se guardar o serviço falhar, tentar de novo não a reenvia.
  const uploadedImage = useRef(null);
  const [explorePage, setExplorePage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [hireCandidate, setHireCandidate] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const userId = user?.id;
  const notificationPanelRef = useRef(null);
  const notificationIdsRef = useRef({ userId: null, ids: new Set() });
  const notificationSoundEnabledRef = useRef(preferences.notifications);
  const walletActionInProgressRef = useRef(false);

  useEffect(() => {
    notificationSoundEnabledRef.current = preferences.notifications;
  }, [preferences.notifications]);

  const refreshNotifications = useCallback(async (force = false) => {
    if (!userId || (walletActionInProgressRef.current && !force)) return false;
    try {
      const latest = await api("/notifications");
      const known = notificationIdsRef.current;
      setNotifications(latest);
      if (known.userId !== userId) {
        notificationIdsRef.current = {
          userId,
          ids: new Set(latest.map((item) => item.id)),
        };
        return false;
      }

      const incoming = latest.filter(
        (item) => !item.read && !known.ids.has(item.id),
      );
      latest.forEach((item) => known.ids.add(item.id));
      if (incoming.length && notificationSoundEnabledRef.current) {
        playNotificationSound();
        setToast(incoming[0].title);
      }
      return incoming.length > 0 && notificationSoundEnabledRef.current;
    } catch {
      // Keep the last loaded notification state if the API is temporarily offline.
      return false;
    }
  }, [userId]);

  const load = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const [nextServices, nextBookings] = await Promise.all([
      // O cliente vê todos os serviços; o prestador, só os seus.
      allPages(
        "/services",
        currentUser.role === "CLIENT" ? {} : { providerId: currentUser.id },
      ),
      allPages("/bookings"),
    ]);
    setServices(nextServices.map(toService));
    setTransactions(nextBookings.map(toTransaction));
  }, []);

  const restoreSettings = (account) => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(`presta-ja.settings.${account.id}`) || "{}",
      );
      setPreferences({
        notifications: true,
        confirmHire: true,
        ...saved.preferences,
      });
      setCards(Array.isArray(saved.cards) ? saved.cards : []);
    } catch {
      /* ignore invalid local preferences */
    }
  };
  useEffect(() => {
    // A sessão vive em cookies httpOnly: pergunta-se à API quem está autenticado.
    // Sem sessão a resposta é 401 e aparece o ecrã de entrada.
    api("/auth/me")
      .then(async (me) => {
        const account = toUser(me);
        setUser(account);
        restoreSettings(account);
        await load(account).catch((e) => setError(e.message));
      })
      // 401 é o esperado sem sessão. Qualquer outro erro (rede, servidor) explica-se no ecrã de entrada.
      .catch((e) => {
        if (e.status !== 401) setBootError(e.message);
      })
      .finally(() => setBooting(false));
  }, [load]);
  useEffect(() => {
    const unlock = () => unlockNotificationSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);
  useEffect(() => {
    if (!userId) {
      notificationIdsRef.current = { userId: null, ids: new Set() };
      return undefined;
    }

    const initialPoll = window.setTimeout(() => refreshNotifications(), 0);
    const poll = () => {
      if (document.visibilityState !== "hidden") refreshNotifications();
    };
    const interval = window.setInterval(poll, 15000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      window.clearTimeout(initialPoll);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [refreshNotifications, userId]);
  useEffect(() => {
    const logout = () => {
      setUser(null);
      setNotifications([]);
      setBooting(false);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!confirmLogout) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setConfirmLogout(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmLogout]);
  useEffect(() => {
    if (!hireCandidate) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setHireCandidate(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [hireCandidate]);
  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!notificationPanelRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);
  useEffect(() => {
    delete document.documentElement.dataset.theme;
    localStorage.removeItem("presta-ja.theme");
  }, []);
  useEffect(() => {
    localStorage.setItem("presta-ja.language", language);
    document.documentElement.lang = language;
  }, [language]);
  useEffect(() => {
    if (!userId) return;
    localStorage.setItem(
      `presta-ja.settings.${userId}`,
      JSON.stringify({ preferences, cards }),
    );
  }, [userId, preferences, cards]);
  const isClient = user?.role === "CLIENT";
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const notificationBadgeCount = preferences.notifications
    ? unreadNotifications
    : 0;
  const mine = useMemo(
    () =>
      transactions.filter((tx) =>
        isClient ? tx.clientId === user?.id : tx.providerId === user?.id,
      ),
    [transactions, isClient, user],
  );
  const filtered = useMemo(
    () =>
      services
        .filter(
          (service) =>
            (category === "Todos" || service.category === category) &&
            `${service.title} ${service.description} ${service.providerName}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "rating"
            ? (b.rating || 0) - (a.rating || 0)
            : sort === "cheap"
              ? a.price - b.price
              : sort === "expensive"
                ? b.price - a.price
                : 0,
        ),
    [services, category, search, sort],
  );
  const explorePageSize = 8;
  const exploreTotalPages = Math.ceil(filtered.length / explorePageSize);
  const pagedServices = filtered.slice(
    (explorePage - 1) * explorePageSize,
    explorePage * explorePageSize,
  );
  const total = mine.reduce((sum, tx) => sum + tx.amount, 0);

  const action = async (work, success) => {
    setBusy(true);
    setError("");
    try {
      await work();
      if (success) setToast(success);
      await load(user);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const markAllNotificationsRead = async () => {
    setNotificationsBusy(true);
    try {
      await api("/notifications/read", { method: "POST" });
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true })),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setNotificationsBusy(false);
    }
  };
  const logout = () => {
    // A API revoga a sessão e limpa os cookies. Se falhar, sai-se na mesma deste lado.
    api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setNotifications([]);
    setPage("home");
    setConfirmLogout(false);
  };
  const requestLogout = () => setConfirmLogout(true);

  if (!initialized || booting)
    return (
      <div className="loading-screen">
        <Brand />
        <span className="spinner" />
      </div>
    );
  if (!user)
    return (
      <Auth
        notice={bootError}
        onLogin={(next) => {
          restoreSettings(next);
          setNotifications([]);
          setUser(next);
          setPage("home");
          load(next).catch((e) => setError(e.message));
        }}
      />
    );

  const navItems = isClient
    ? [
        ["home", language === "en" ? "Home" : "Início", "home"],
        [
          "explore",
          language === "en" ? "Explore services" : "Explorar serviços",
          "search",
        ],
        [
          "wallet",
          language === "en" ? "Wallet" : "Carteira",
          "account_balance_wallet",
        ],
        ["history", language === "en" ? "History" : "Histórico", "history"],
        ["profile", language === "en" ? "Profile" : "Perfil", "person"],
        ["settings", language === "en" ? "Settings" : "Definições", "settings"],
      ]
    : [
        ["home", language === "en" ? "Overview" : "Visão geral", "home"],
        [
          "services",
          language === "en" ? "My services" : "Os meus serviços",
          "grid_view",
        ],
        [
          "wallet",
          language === "en" ? "Wallet" : "Carteira",
          "account_balance_wallet",
        ],
        ["history", language === "en" ? "History" : "Histórico", "history"],
        ["profile", language === "en" ? "Profile" : "Perfil", "person"],
        ["settings", language === "en" ? "Settings" : "Definições", "settings"],
      ];

  const completeHire = async (service) => {
    const succeeded = await action(async () => {
      await api(`/services/${service.id}/hire`, json("POST", {}));
      setSelected(null);
      setHireCandidate(null);
    }, "Serviço contratado com sucesso.");
    if (succeeded) setUser(toUser(await api("/auth/me")));
  };
  const hire = (service) => {
    if (preferences.confirmHire) {
      setError("");
      setHireCandidate(service);
      return;
    }
    void completeHire(service);
  };
  const wallet = async (event) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const amount = Number(String(form.get("amount")).replace(",", "."));
    if (!(amount > 0)) return setError("Introduza um valor maior que zero.");
    walletActionInProgressRef.current = isClient;
    const succeeded = await action(
      async () => {
        setUser(
          await api(
            isClient ? "/me/deposit" : "/me/withdraw",
            json("POST", { amount }),
          ),
        );
        element.reset();
      },
      isClient ? "Saldo adicionado." : "Levantamento concluído.",
    );
    walletActionInProgressRef.current = false;
    if (isClient && succeeded) {
      const notificationPlayed = await refreshNotifications(true);
      if (!notificationPlayed && notificationSoundEnabledRef.current) {
        playNotificationSound();
      }
    }
  };
  const startEditing = (service) => {
    setEditingService(service);
    setFormKey((key) => key + 1);
  };
  const stopEditing = () => {
    setEditingService(null);
    setFormKey((key) => key + 1);
  };
  // Cria ou atualiza o serviço. A imagem só sai do navegador agora: vai direta ao Cloudinary com a
  // assinatura da API, e o endereço que ele devolve é o que se guarda no serviço.
  const saveService = async (data, image) => {
    const saved = await action(
      async () => {
        let imageUrl;
        if (image.kind === "remove") imageUrl = null;
        if (image.kind === "new") {
          if (uploadedImage.current?.blob !== image.blob) {
            setUploadProgress(0);
            const auth = await imageAuthorization();
            const url = await uploadImage(image.blob, auth, setUploadProgress);
            uploadedImage.current = { blob: image.blob, url };
          }
          imageUrl = uploadedImage.current.url;
        }
        const payload = { ...data, imageUrl };
        if (editingService) await updateService(editingService.id, payload);
        else await createService(payload);
      },
      editingService ? "Serviço atualizado." : "Serviço publicado.",
    );
    setUploadProgress(null);
    if (saved) {
      uploadedImage.current = null;
      stopEditing();
    }
  };
  const deleteService = (service) => {
    if (editingService?.id === service.id) stopEditing();
    return action(() => removeService(service.id), "Serviço removido.");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">MENU PRINCIPAL</div>
        <nav>
          {navItems.map(([key, label, glyph]) => (
            <button
              key={key}
              className={`nav-item ${page === key ? "active" : ""}`}
              onClick={() => {
                setPage(key);
                setError("");
              }}
            >
              <Icon name={glyph} className="nav-glyph" />
              {label}
              {page === key && <span className="nav-active-mark" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="sidebar-logout"
            onClick={requestLogout}
          >
            <Icon name="logout" />
            <span>{language === "en" ? "Sign out" : "Terminar sessão"}</span>
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand small />
          </div>
          <div className="breadcrumb">
            <b>{navItems.find(([key]) => key === page)?.[1] ?? "Início"}</b>
          </div>
          <div className="top-actions">
            <div className="notification-anchor" ref={notificationPanelRef}>
              <button
                className="icon-button"
                aria-label={`${language === "en" ? "Notifications" : "Notificações"}${notificationBadgeCount ? ` (${notificationBadgeCount})` : ""}`}
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Icon name="notifications" className="top-notification-icon" />
                {notificationBadgeCount > 0 && (
                  <span className="notification-badge">
                    {notificationBadgeCount > 9 ? "9+" : notificationBadgeCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <section
                  className="notification-panel"
                  role="dialog"
                  aria-label={language === "en" ? "Notifications" : "Notificações"}
                >
                  <header className="notification-panel-header">
                    <div>
                      <h2>{language === "en" ? "Notifications" : "Notificações"}</h2>
                      <span>
                        {language === "en"
                          ? `${unreadNotifications} unread`
                          : `${unreadNotifications} por ler`}
                      </span>
                    </div>
                    <button
                      className="notification-read-all"
                      disabled={!unreadNotifications || notificationsBusy}
                      onClick={markAllNotificationsRead}
                    >
                      {language === "en" ? "Mark all read" : "Marcar lidas"}
                    </button>
                  </header>
                  <div className="notification-list">
                    {notifications.length ? (
                      notifications.slice(0, 12).map((notification) => (
                        <article
                          className={`notification-item ${notification.read ? "" : "unread"}`}
                          key={notification.id}
                        >
                          <span className="notification-item-icon">
                            <Icon name="notifications" />
                          </span>
                          <div>
                            <h3>{notification.title}</h3>
                            <p>{notification.body}</p>
                            <time dateTime={notification.createdAt}>
                              {new Date(notification.createdAt).toLocaleString(
                                language === "en" ? "en-GB" : "pt-PT",
                                { dateStyle: "short", timeStyle: "short" },
                              )}
                            </time>
                          </div>
                          {!notification.read && <i aria-label="Por ler" />}
                        </article>
                      ))
                    ) : (
                      <p className="notifications-empty">
                        {language === "en" ? "No notifications yet." : "Ainda não tem notificações."}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
            <span className="top-divider" />
            <button className="top-user" onClick={() => setPage("profile")}>
              <span className="avatar avatar-small">{user.name[0]}</span>
              <span>{user.name.split(" ")[0]}</span>
              <Icon name="keyboard_arrow_down" className="chevron" />
            </button>
          </div>
        </header>
        <section className="page-content">
          {error && (
            <div className="error-banner">
              {error}
              <button aria-label="Fechar aviso" onClick={() => setError("")}>
                <Icon name="close" />
              </button>
            </div>
          )}
          {page === "home" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {isClient ? "O SEU ESPAÇO" : "PAINEL DO PRESTADOR"}
                  </span>
                  <h1>
                    {isClient
                      ? `Olá, ${user.name.split(" ")[0]}`
                      : `Bom dia, ${user.name.split(" ")[0]}`}
                  </h1>
                  <p>
                    {isClient
                      ? "Encontre o profissional certo para o que precisa."
                      : "Veja como está a sua atividade hoje."}
                  </p>
                </div>
                {isClient && (
                  <button
                    className="button button-primary"
                    onClick={() => setPage("explore")}
                  >
                    Encontrar serviço{" "}
                    <Icon name="arrow_forward" className="button-icon" />
                  </button>
                )}
                {!isClient && (
                  <button
                    className="button button-primary"
                    onClick={() => setPage("services")}
                  >
                    <Icon name="add" /> Publicar serviço
                  </button>
                )}
              </div>
              <div className="overview-grid">
                <div className="balance-card">
                  <div className="balance-card-top">
                    <span>
                      {isClient ? "Saldo disponível" : "Saldo (ganhos)"}
                    </span>
                    <Icon
                      name="account_balance_wallet"
                      className="balance-icon"
                    />
                  </div>
                  <strong>{money(user.balance)}</strong>
                  <div className="balance-card-bottom">
                    <span>
                      {isClient
                        ? "Use o saldo para contratar serviços."
                        : "Os seus ganhos estão prontos para levantar."}
                    </span>
                    <button onClick={() => setPage("wallet")}>
                      {isClient ? "Adicionar saldo" : "Levantar"}{" "}
                      <Icon name="arrow_forward" className="button-icon" />
                    </button>
                  </div>
                </div>
                <div className="stat-card">
                  <Icon name="trending_up" className="stat-icon teal" />
                  <div>
                    <small>
                      {isClient ? "Contratações" : "Vendas realizadas"}
                    </small>
                    <strong>{mine.length}</strong>
                    <span>
                      {mine.length ? "No seu histórico" : "Ainda sem atividade"}
                    </span>
                  </div>
                </div>
                <div className="stat-card">
                  <Icon name="schedule" className="stat-icon blue" />
                  <div>
                    <small>{isClient ? "Total gasto" : "Receita total"}</small>
                    <strong>{money(total)}</strong>
                    <span>
                      {isClient
                        ? "Em serviços contratados"
                        : "Em serviços concluídos"}
                    </span>
                  </div>
                </div>
              </div>
              {isClient ? (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>Destaques para si</h2>
                      <p>Serviços bem avaliados pela comunidade</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setPage("explore")}
                    >
                      Ver todos{" "}
                      <Icon name="arrow_forward" className="button-icon" />
                    </button>
                  </div>
                  <div className="service-grid">
                    {[...services]
                      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                      .slice(0, 4)
                      .map((service) => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onClick={() => setSelected(service)}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="section-heading">
                    <div>
                      <h2>Os seus serviços</h2>
                      <p>Os serviços visíveis para os clientes</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setPage("services")}
                    >
                      Gerir serviços{" "}
                      <Icon name="arrow_forward" className="button-icon" />
                    </button>
                  </div>
                  <div className="service-grid">
                    {services.slice(0, 4).map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onClick={() => setPage("services")}
                      />
                    ))}
                    {!services.length && (
                      <Empty
                        title="Ainda não publicou serviços"
                        text="Crie o seu primeiro serviço para começar a receber pedidos."
                        action="Publicar serviço"
                        onClick={() => setPage("services")}
                      />
                    )}
                  </div>
                </>
              )}
              <div className="section-heading section-heading-spaced">
                <div>
                  <h2>Atividade recente</h2>
                  <p>As últimas movimentações da sua conta</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => setPage("history")}
                >
                  Ver histórico{" "}
                  <Icon name="arrow_forward" className="button-icon" />
                </button>
              </div>
              <TransactionTable rows={mine.slice(0, 4)} isClient={isClient} />
            </>
          )}
          {page === "explore" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">CATÁLOGO DE SERVIÇOS</span>
                  <h1>Explorar serviços</h1>
                  <p>Profissionais e soluções para o seu dia a dia.</p>
                </div>
              </div>
              <div className="explore-tools">
                <div className="search-box">
                  <Icon name="search" />
                  <input
                    placeholder="Pesquisar serviço ou profissional"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setExplorePage(1);
                    }}
                  />
                  <kbd>Ctrl K</kbd>
                </div>
                <FilterSelect
                  label="Ordenar por"
                  value={sort}
                  onChange={(value) => {
                    setSort(value);
                    setExplorePage(1);
                  }}
                  options={[
                    { value: "relevance", label: "Mais relevantes" },
                    { value: "rating", label: "Melhor avaliados" },
                    { value: "cheap", label: "Menor preço" },
                    { value: "expensive", label: "Maior preço" },
                  ]}
                />
              </div>
              <div className="category-row">
                {categories.map((item) => (
                  <button
                    key={item}
                    className={category === item ? "selected" : ""}
                    onClick={() => {
                      setCategory(item);
                      setExplorePage(1);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="results-label">
                {filtered.length} serviços disponíveis
              </div>
              <div className="service-grid">
                {pagedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onClick={() => setSelected(service)}
                  />
                ))}
                {!filtered.length && (
                  <Empty
                    title="Não encontrámos serviços"
                    text="Experimente outra pesquisa ou categoria."
                  />
                )}
              </div>
              <Pagination
                totalItems={filtered.length}
                pageSize={explorePageSize}
                currentPage={explorePage}
                totalPages={exploreTotalPages}
                onPageChange={setExplorePage}
              />
            </>
          )}
          {page === "wallet" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">GESTÃO DE SALDO</span>
                  <h1>A sua carteira</h1>
                  <p>
                    {isClient
                      ? "Adicione saldo e pague pelos serviços com facilidade."
                      : "Consulte os seus ganhos e solicite um levantamento."}
                  </p>
                </div>
              </div>
              <div className="wallet-layout">
                <div className="balance-card balance-card-large">
                  <div className="balance-card-top">
                    <span>
                      {isClient ? "Saldo disponível" : "Saldo de ganhos"}
                    </span>
                    <Icon
                      name="account_balance_wallet"
                      className="balance-icon"
                    />
                  </div>
                  <strong>{money(user.balance)}</strong>
                  <div className="balance-card-bottom">
                    <span>Atualizado agora</span>
                    <span className="secure-note">
                      <Icon name="verified_user" /> Conta protegida
                    </span>
                  </div>
                </div>
                <div className="panel wallet-form">
                  <div className="panel-title">
                    <Icon
                      name={isClient ? "add" : "arrow_upward"}
                      className="form-icon"
                    />
                    <div>
                      <h2>
                        {isClient ? "Adicionar saldo" : "Levantar ganhos"}
                      </h2>
                      <p>
                        {isClient
                          ? "Escolha o valor que pretende adicionar."
                          : "O valor será descontado do seu saldo atual."}
                      </p>
                    </div>
                  </div>
                  <form className="form-stack" onSubmit={wallet}>
                    <label>
                      Valor em Kz
                      <input
                        name="amount"
                        required
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Ex.: 10 000"
                      />
                    </label>
                    <div className="quick-amounts">
                      {[5000, 10000, 25000, 50000].map((amount) => (
                        <button
                          type="button"
                          key={amount}
                          onClick={(event) => {
                            event.currentTarget.form.elements.amount.value =
                              amount;
                          }}
                        >
                          {amount / 1000} mil
                        </button>
                      ))}
                    </div>
                    <button
                      className="button button-primary button-wide"
                      disabled={busy}
                    >
                      {busy
                        ? "A processar…"
                        : isClient
                          ? "Adicionar saldo"
                          : "Solicitar levantamento"}{" "}
                      <Icon name="arrow_forward" className="button-icon" />
                    </button>
                  </form>
                </div>
              </div>
              <div className="section-heading section-heading-spaced">
                <div>
                  <h2>Movimentos recentes</h2>
                  <p>Movimentos de contratação e vendas</p>
                </div>
              </div>
              <TransactionTable rows={mine.slice(0, 5)} isClient={isClient} />
            </>
          )}
          {page === "history" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">MOVIMENTOS DA CONTA</span>
                  <h1>Histórico</h1>
                  <p>Consulte as suas contratações e vendas.</p>
                </div>
              </div>
              <TransactionTable rows={mine} isClient={isClient} />
            </>
          )}
          {page === "services" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">A SUA VITRINE</span>
                  <h1>Os meus serviços</h1>
                  <p>Crie e atualize os serviços que oferece.</p>
                </div>
              </div>
              <div className="provider-services-layout">
                <div className="service-grid">
                  {services.map((service) => (
                    <article className="service-card" key={service.id}>
                      <ServiceCard
                        service={service}
                        onClick={() => setSelected(service)}
                      />
                      <div className="service-actions">
                        <button
                          type="button"
                          className="button button-outline"
                          disabled={busy}
                          onClick={() => startEditing(service)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="button button-danger delete-service"
                          disabled={busy}
                          onClick={() => deleteService(service)}
                        >
                          Remover
                        </button>
                      </div>
                    </article>
                  ))}
                  {!services.length && (
                    <Empty
                      title="A sua vitrine está vazia"
                      text="Adicione o seu primeiro serviço."
                    />
                  )}
                </div>
                <ServiceForm
                  key={formKey}
                  editing={editingService}
                  busy={busy}
                  progress={uploadProgress}
                  onSubmit={saveService}
                  onCancel={stopEditing}
                />
              </div>
            </>
          )}
          {page === "profile" && (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">A SUA CONTA</span>
                  <h1>Perfil</h1>
                  <p>Os seus dados e preferências.</p>
                </div>
              </div>
              <div className="panel profile-card">
                <div className="profile-avatar">{user.name[0]}</div>
                <div className="profile-details">
                  <span className="eyebrow">
                    {isClient ? "CLIENTE" : "PRESTADOR"}
                  </span>
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>
                  {user.phone && <p>{user.phone}</p>}
                </div>
                <div className="profile-balance">
                  <small>Saldo atual</small>
                  <strong>{money(user.balance)}</strong>
                </div>
              </div>
              <div className="panel profile-info">
                <h2>Dados da conta</h2>
                <div>
                  <span>Nome</span>
                  <b>{user.name}</b>
                </div>
                <div>
                  <span>E-mail</span>
                  <b>{user.email}</b>
                </div>
                {user.nif && (
                  <div>
                    <span>NIF</span>
                    <b>{user.nif}</b>
                  </div>
                )}
                <div>
                  <span>Tipo de perfil</span>
                  <b>{isClient ? "Cliente" : "Prestador"}</b>
                </div>
              </div>
            </>
          )}
          {page === "settings" && (
            <SettingsPage
              user={user}
              onUserUpdate={setUser}
              language={language}
              setLanguage={setLanguage}
              preferences={preferences}
              setPreferences={setPreferences}
              cards={cards}
              setCards={setCards}
              onLogout={requestLogout}
              onToast={setToast}
              onError={setError}
            />
          )}
        </section>
      </main>
      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <article className="service-modal">
            <button
              className="modal-close"
              aria-label="Fechar"
              onClick={() => setSelected(null)}
            >
              <Icon name="close" />
            </button>
            <ServiceImage service={selected} large />
            <div className="modal-content">
              <span className="category-tag">
                {selected.category || "Serviço"}
              </span>
              <h2>{selected.title}</h2>
              <p className="provider-by">
                Prestado por <b>{selected.providerName}</b> ·{" "}
                <Icon name="star" className="rating-icon" />{" "}
                {selected.rating || "Novo"}{" "}
                {selected.reviewsCount
                  ? `(${selected.reviewsCount} avaliações)`
                  : ""}
              </p>
              <p className="modal-description">{selected.description}</p>
              <div className="modal-price">
                <small>Preço do serviço</small>
                <strong>{money(selected.price)}</strong>
              </div>
              {isClient && (
                <button
                  className="button button-primary button-wide"
                  disabled={busy}
                  onClick={() => hire(selected)}
                >
                  {busy ? "A contratar…" : "Contratar serviço"}{" "}
                  <Icon name="arrow_forward" className="button-icon" />
                </button>
              )}
            </div>
          </article>
        </div>
      )}
      {hireCandidate && (
        <div
          className="modal-backdrop hire-confirm-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHireCandidate(null);
          }}
        >
          <section
            className="hire-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hire-confirm-title"
          >
            <span className="hire-confirm-icon"><Icon name="check_circle" /></span>
            <h2 id="hire-confirm-title">
              {language === "en" ? "Confirm booking?" : "Confirmar contratação?"}
            </h2>
            <p className="hire-confirm-copy">
              {language === "en"
                ? "Review the service and amount before continuing."
                : "Confirme o serviço e o valor antes de continuar."}
            </p>
            <div className="hire-confirm-summary">
              <div>
                <span>{language === "en" ? "Service" : "Serviço"}</span>
                <b>{hireCandidate.title}</b>
              </div>
              <div>
                <span>{language === "en" ? "Provider" : "Prestador"}</span>
                <b>{hireCandidate.providerName}</b>
              </div>
              <div>
                <span>{language === "en" ? "Price" : "Preço"}</span>
                <b>{money(hireCandidate.price)}</b>
              </div>
              <div>
                <span>{language === "en" ? "Balance after booking" : "Saldo após contratar"}</span>
                <b>{money(Math.max(0, user.balance - hireCandidate.price))}</b>
              </div>
            </div>
            {user.balance < hireCandidate.price && (
              <p className="hire-insufficient">
                {language === "en"
                  ? "Your wallet balance is not enough for this service."
                  : "O saldo da carteira não é suficiente para este serviço."}
              </p>
            )}
            {error && <p className="hire-error">{error}</p>}
            <div className="hire-confirm-actions">
              <button
                type="button"
                className="button button-outline"
                disabled={busy}
                onClick={() => setHireCandidate(null)}
              >
                {language === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={busy || user.balance < hireCandidate.price}
                onClick={() => completeHire(hireCandidate)}
              >
                {busy
                  ? language === "en" ? "Booking…" : "A contratar…"
                  : language === "en" ? "Confirm booking" : "Confirmar"}
              </button>
            </div>
          </section>
        </div>
      )}
      {confirmLogout && (
        <div
          className="modal-backdrop logout-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setConfirmLogout(false);
          }}
        >
          <section
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <span className="logout-modal-icon"><Icon name="logout" /></span>
            <h2 id="logout-title">{language === "en" ? "Sign out?" : "Terminar sessão?"}</h2>
            <p>{language === "en" ? "Are you sure you want to sign out of your account?" : "Tem a certeza de que pretende terminar a sessão na sua conta?"}</p>
            <div className="logout-modal-actions">
              <button className="button button-outline" onClick={() => setConfirmLogout(false)}>
                {language === "en" ? "Cancel" : "Cancelar"}
              </button>
              <button className="button button-danger" onClick={logout}>
                {language === "en" ? "Sign out" : "Terminar sessão"}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" />
          {toast}
        </div>
      )}
      <MobileNav items={navItems} page={page} setPage={setPage} />
    </div>
  );
}

export default App;
