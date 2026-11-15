// Os ícones são os da fonte Material Design Icons: cada nome do painel aponta para um glifo da
// fonte, e cada glifo tem o seu código. O TypeScript garante que todos os glifos têm código.
const iconGlyphs = {
  account_balance_wallet: "wallet",
  add: "plus",
  arrow_forward: "arrow-right",
  arrow_outward: "arrow-top-right",
  arrow_upward: "arrow-up",
  auto_awesome: "auto-fix",
  check: "check",
  check_circle: "check-circle",
  chevron_right: "chevron-right",
  close: "close",
  credit_card: "credit-card",
  devices: "devices",
  grid_view: "view-grid",
  help: "help",
  image: "image",
  history: "history",
  home: "home",
  home_repair_service: "home-lightning-bolt",
  info: "information",
  keyboard_arrow_down: "chevron-down",
  lock: "lock",
  logout: "logout",
  more_horiz: "dots-horizontal",
  notifications: "bell",
  payments: "cash-multiple",
  person: "account",
  face: "face-woman",
  school: "school",
  health_and_safety: "medical-bag",
  event: "calendar-star",
  directions_car: "car",
  location_on: "map-marker",
  account_circle: "account-circle",
  schedule: "clock-outline",
  search: "magnify",
  search_off: "text-search",
  settings: "cog",
  star: "star",
  support_agent: "face-agent",
  trending_up: "trending-up",
  verified_user: "shield-check",
} as const;

const iconCodepoints = {
  wallet: 984452, plus: 984085, "arrow-right": 983124, "arrow-top-right": 983132,
  "arrow-up": 983133, "auto-fix": 983144, check: 983340, "check-circle": 984544,
  "chevron-right": 983362, close: 983382, "credit-card": 987119,
  devices: 987056, "view-grid": 984432, help: 983766,
  history: 983770, image: 983785, home: 983772, "home-lightning-bolt": 989443, information: 983804,
  "chevron-down": 983360, lock: 983870, logout: 983875,
  "dots-horizontal": 983512, bell: 983194, account: 983044, "clock-outline": 983376,
  magnify: 983881, "text-search": 988088, cog: 984211,
  star: 984270, "face-agent": 986480, "trending-up": 984373, "shield-check": 984421,
  "map-marker": 983882, "cash-multiple": 984039, "face-woman": 987695,
  school: 984153, "medical-bag": 983887, "calendar-star": 983300, car: 983243,
  "account-circle": 983046,
} as const satisfies Record<(typeof iconGlyphs)[keyof typeof iconGlyphs], number>;

export type IconName = keyof typeof iconGlyphs;

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const glyph = iconCodepoints[iconGlyphs[name]];
  return (
    <span aria-hidden="true" className={`material-design-icon ${className}`}>
      {String.fromCodePoint(glyph)}
    </span>
  );
}
