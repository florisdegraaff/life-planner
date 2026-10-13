// Static placeholder data taken from the design. Replace with real sources
// (bank, calendar, Todoist, Strava) once integrations are wired up.

export const user = { name: "Floris de Graaff", firstName: "Floris", initials: "FG" };

export const icons = {
  overview: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  finance: "M3 7h18v12H3z M3 7l3-3h12l3 3 M16 13h2",
  recipes: "M4 11h16v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z M2 11h20 M9 4v3 M12 3v4 M15 4v3",
  lists: "M9 6h11 M9 12h11 M9 18h11 M4 6h1 M4 12h1 M4 18h1",
  goals:
    "M4 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M16 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M10 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0 M7 7l4 10 M17 7l-4 10",
  fitness: "M3 12h4l3-8 4 16 3-8h4",
  bike: "M5 17a3 3 0 1 0 0.01 0 M19 17a3 3 0 1 0 0.01 0 M5 17l4-8h6l4 8 M9 9l3 8",
  lift: "M4 9v6 M8 7v10 M16 7v10 M20 9v6 M8 12h8",
  search: "M10 4a6 6 0 1 0 0.01 0 M15 15l5 5",
  plus: "M12 5v14 M5 12h14",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sun: "M12 8a4 4 0 1 0 0.01 0 M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
  chevronDown: "M5 9l7 7 7-7",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  check: "M5 12l5 5 9-10",
  close: "M6 6l12 12 M18 6L6 18",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  lock: "M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3",
};

export const nav = [
  { label: "Overview", href: "/", icon: icons.overview },
  { label: "Finance", href: "/finance", icon: icons.finance },
  { label: "Recipes", href: "/recipes", icon: icons.recipes },
  { label: "Lists", href: "/lists", icon: icons.lists },
  { label: "Goals", href: "/goals", icon: icons.goals },
  { label: "Fitness", href: "/fitness", icon: icons.fitness },
];

export const integrations = [
  { name: "Bank", status: "not set up", ok: false },
  { name: "Calendar", status: "synced", ok: true },
  { name: "Todoist", status: "synced", ok: true },
  { name: "Strava", status: "14:02", ok: true },
  { name: "Claude API", status: "ready", ok: true },
];

/* ---------- Overview ---------- */

export const overview = {
  date: "Tue 13-10-2026",
  greeting: "Good afternoon",
  suggestion: {
    label: "From your calendar · in 10 days",
    text: "Weekend in the Ardennes, Fri 23 – Sun 25 Oct. Want a packing list?",
  },
  upcoming: [
    { date: "20-10", name: "Health insurance", cat: "Insurance", amount: "€ 148,25" },
    { date: "24-10", name: "Spotify", cat: "Subscriptions", amount: "€ 11,99" },
    { date: "28-10", name: "DUO student loan", cat: "Debt", amount: "€ 210,00" },
    { date: "01-11", name: "Rent", cat: "Housing", amount: "€ 1.150,00" },
  ],
  meals: [
    { day: "Mon", name: "Chickpea curry with rice", kcal: "640 kcal" },
    { day: "Tue", name: "Stamppot boerenkool", kcal: "710 kcal" },
    { day: "Wed", name: "Salmon, potatoes & greens", kcal: "590 kcal" },
    { day: "Thu", name: "Pasta arrabbiata", kcal: "620 kcal" },
  ],
  availableGoals: [
    { name: "Run 10 km", module: "Fitness" },
    { name: "Build UX portfolio", module: "Career" },
    { name: "Pay off student loan", module: "Finance" },
  ],
  tasks: [
    { name: "Book cabin for the Ardennes", done: true },
    { name: "Pay energy bill", done: false },
    { name: "Sunday meal prep", done: false },
    { name: "Call DUO about repayment", done: false },
  ],
  weightSparkline: "2,8 22,11 42,15 62,13 82,21 102,24 122,27 142,32 162,34 182,40 202,44 222,47 238,52",
};

/* ---------- Finance ---------- */

export const finance = {
  month: "October 2026",
  summary: [
    { label: "Income", value: "€ 2.887,90", note: "1 transaction · salary" },
    { label: "Expenses", value: "€ 2.065,50", note: "62% of € 3.350,00 budget" },
    { label: "Debt payments", value: "€ 210,00", note: "scheduled 28-10 · DUO", tone: "accent" as const },
    { label: "Net (projected)", value: "+ € 612,40", note: "after scheduled payments", tone: "inverse" as const },
  ],
  budget: { left: "€ 1.284,50", total: "€ 3.350,00", spent: "€ 2.065,50", pct: 62, daysLeft: 18, net: "+ € 612,40" },
  // Bar heights in px on a 200px chart.
  cashflow: [
    { month: "May", income: 143, expenses: 121 },
    { month: "Jun", income: 143, expenses: 131 },
    { month: "Jul", income: 143, expenses: 155 },
    { month: "Aug", income: 143, expenses: 119 },
    { month: "Sep", income: 145, expenses: 128 },
    { month: "Oct", income: 145, expenses: 104, partial: true },
  ],
  categories: [
    { name: "Housing", amount: "€ 1.150,00", pct: 100 },
    { name: "Groceries", amount: "€ 312,40", pct: 27 },
    { name: "Utilities & other", amount: "€ 151,38", pct: 13 },
    { name: "Insurance", amount: "€ 148,25", pct: 13 },
    { name: "Transport", amount: "€ 148,00", pct: 13 },
    { name: "Eating out", amount: "€ 96,50", pct: 8, flagged: true },
    { name: "Subscriptions", amount: "€ 58,97", pct: 5 },
  ],
  categoryNote: "Eating out is 21% above your 3-month average.",
  transactions: [
    { date: "13-10", desc: "Albert Heijn", cat: "Groceries", by: "rule", type: "expense", rec: "One-off", amount: "− € 38,72" },
    { date: "12-10", desc: "NS Reizen", cat: "Transport", by: "AI", type: "expense", rec: "One-off", amount: "− € 14,20" },
    { date: "10-10", desc: "Thuisbezorgd", cat: "Eating out", by: "AI", type: "expense", rec: "One-off", amount: "− € 27,50" },
    { date: "09-10", desc: "Jumbo", cat: "Groceries", by: "rule", type: "expense", rec: "One-off", amount: "− € 52,18" },
    { date: "05-10", desc: "Vattenfall", cat: "Utilities", by: "rule", type: "expense", rec: "Monthly", amount: "− € 92,00" },
    { date: "03-10", desc: "Basic-Fit", cat: "Subscriptions", by: "rule", type: "expense", rec: "Monthly", amount: "− € 29,99" },
    { date: "01-10", desc: "Rent", cat: "Housing", by: "rule", type: "expense", rec: "Monthly", amount: "− € 1.150,00" },
    { date: "01-10", desc: "Salary", cat: "Income", by: "rule", type: "income", rec: "Monthly", amount: "+ € 2.887,90" },
    { date: "28-09", desc: "DUO", cat: "Debt", by: "rule", type: "debt", rec: "Monthly", amount: "− € 210,00" },
  ] as Transaction[],
  studentLoan: { name: "Student loan · DUO", remaining: "€ 18.600", pct: 38, total: "€ 30.000", monthly: "€ 210 / month", eta: "≈ 2034" },
  paidOff: [{ name: "Credit card", when: "Mar 2026" }],
  recurring: { recurringCount: 9, recurringAmount: "€ 1.607,22", oneOffCount: 31, oneOffAmount: "€ 458,28", pct: 78 },
};

export type TransactionType = "income" | "expense" | "debt";

export type Transaction = {
  date: string;
  desc: string;
  cat: string;
  by: "rule" | "AI";
  type: TransactionType;
  rec: string;
  amount: string;
};

/* ---------- Recipes ---------- */

export type Aisle = "Produce" | "Meat & fish" | "Dairy & eggs" | "Pantry";
export type Unit = "g" | "ml" | "pc" | "cloves";

export type Recipe = {
  id: number;
  name: string;
  min: number;
  kcal: number;
  tags: string[];
  tint: string;
  ingredients: [name: string, qty: number, unit: Unit, aisle: Aisle][];
};

export const recipeTags = ["All", "Vegetarian", "Quick", "High protein", "Dutch"];
export const aisles: Aisle[] = ["Produce", "Meat & fish", "Dairy & eggs", "Pantry"];

export const recipes: Recipe[] = [
  {
    id: 1, name: "Chickpea curry with rice", min: 35, kcal: 640, tags: ["Vegetarian"], tint: "#F1E3C8",
    ingredients: [["Chickpeas", 400, "g", "Pantry"], ["Onion", 1, "pc", "Produce"], ["Garlic", 2, "cloves", "Produce"], ["Coconut milk", 400, "ml", "Pantry"], ["Rice", 150, "g", "Pantry"], ["Spinach", 100, "g", "Produce"]],
  },
  {
    id: 2, name: "Stamppot boerenkool", min: 40, kcal: 710, tags: ["Dutch"], tint: "#DCE8D6",
    ingredients: [["Potatoes", 800, "g", "Produce"], ["Kale", 300, "g", "Produce"], ["Rookworst", 1, "pc", "Meat & fish"], ["Milk", 100, "ml", "Dairy & eggs"], ["Butter", 20, "g", "Dairy & eggs"]],
  },
  {
    id: 3, name: "Salmon, potatoes & green beans", min: 30, kcal: 590, tags: ["High protein", "Quick"], tint: "#F3D9CC",
    ingredients: [["Salmon", 250, "g", "Meat & fish"], ["Potatoes", 500, "g", "Produce"], ["Green beans", 250, "g", "Produce"], ["Lemon", 1, "pc", "Produce"], ["Butter", 15, "g", "Dairy & eggs"]],
  },
  {
    id: 4, name: "Pasta arrabbiata", min: 25, kcal: 620, tags: ["Vegetarian", "Quick"], tint: "#EED3CF",
    ingredients: [["Pasta", 200, "g", "Pantry"], ["Chopped tomatoes", 400, "g", "Pantry"], ["Garlic", 3, "cloves", "Produce"], ["Onion", 1, "pc", "Produce"], ["Red chili", 1, "pc", "Produce"], ["Parmesan", 30, "g", "Dairy & eggs"]],
  },
  {
    id: 5, name: "Shakshuka", min: 25, kcal: 520, tags: ["Vegetarian", "Quick"], tint: "#F2DDC3",
    ingredients: [["Eggs", 4, "pc", "Dairy & eggs"], ["Chopped tomatoes", 400, "g", "Pantry"], ["Onion", 1, "pc", "Produce"], ["Bell pepper", 1, "pc", "Produce"]],
  },
  {
    id: 6, name: "Red lentil soup", min: 45, kcal: 430, tags: ["Vegetarian"], tint: "#E6E0CC",
    ingredients: [["Red lentils", 200, "g", "Pantry"], ["Carrot", 2, "pc", "Produce"], ["Onion", 1, "pc", "Produce"], ["Vegetable stock", 1000, "ml", "Pantry"]],
  },
  {
    id: 7, name: "Overnight oats", min: 5, kcal: 380, tags: ["Quick"], tint: "#E2E5EE",
    ingredients: [["Oats", 100, "g", "Pantry"], ["Milk", 300, "ml", "Dairy & eggs"], ["Berries", 150, "g", "Produce"]],
  },
  {
    id: 8, name: "Chili sin carne", min: 40, kcal: 600, tags: ["Vegetarian", "High protein"], tint: "#EBD5C8",
    ingredients: [["Kidney beans", 400, "g", "Pantry"], ["Chopped tomatoes", 400, "g", "Pantry"], ["Onion", 1, "pc", "Produce"], ["Bell pepper", 1, "pc", "Produce"], ["Rice", 150, "g", "Pantry"]],
  },
];

/** Recipe id → servings for this week's cart. */
export const initialCart: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2 };
/** Ingredient keys ("name|unit") already in stock. */
export const initialStock: Record<string, boolean> = { "Rice|g": true, "Garlic|cloves": true, "Butter|g": true };
export const cartWeek = 42;

/* ---------- Shopping (phone) ---------- */

export const shoppingList: { aisle: Aisle; items: { name: string; amount: string }[] }[] = [
  {
    aisle: "Produce",
    items: [
      { name: "Green beans", amount: "250 g" }, { name: "Kale", amount: "300 g" }, { name: "Lemon", amount: "× 1" },
      { name: "Onion", amount: "× 2" }, { name: "Potatoes", amount: "1,3 kg" }, { name: "Red chili", amount: "× 1" },
      { name: "Spinach", amount: "100 g" },
    ],
  },
  { aisle: "Meat & fish", items: [{ name: "Rookworst", amount: "× 1" }, { name: "Salmon", amount: "250 g" }] },
  { aisle: "Dairy & eggs", items: [{ name: "Milk", amount: "100 ml" }, { name: "Parmesan", amount: "30 g" }] },
  {
    aisle: "Pantry",
    items: [
      { name: "Chickpeas", amount: "400 g" }, { name: "Chopped tomatoes", amount: "400 g" },
      { name: "Coconut milk", amount: "400 ml" }, { name: "Pasta", amount: "200 g" },
    ],
  },
];
export const initialGot: Record<string, boolean> = { Onion: true, Potatoes: true, Kale: true };

/* ---------- Lists ---------- */

export const listTemplates = [
  { name: "Trip", rules: 14, active: true },
  { name: "Moving house", rules: 22 },
  { name: "Birthday party", rules: 9 },
  { name: "Camping weekend", rules: 18 },
  { name: "Business trip", rules: 8 },
];

export const tripDefaults = {
  destination: "Ardennes, Belgium",
  prefill: "Ardennes · 23–25 Oct",
  days: 3,
  activities: { Hiking: true } as Record<string, boolean>,
  weather: "Rainy",
  stay: "Cabin",
};
export const tripActivities = ["Hiking", "Swimming", "City", "Work"];
export const tripWeather = ["Mild", "Cold", "Rainy", "Hot"];
export const tripStay = ["Hotel", "Cabin", "Tent"];
export const packingCategories = ["Clothing", "Gear", "Sleeping", "Toiletries", "Electronics"];

/* ---------- Goals ---------- */

export type Goal = {
  id: string;
  name: string;
  module: string;
  x: number;
  y: number;
  deps: string[];
  track: string;
};

export const goals: Goal[] = [
  { id: "ef", name: "Emergency fund € 3k", module: "Finance", x: 40, y: 40, deps: [], track: "Tracked from your savings balance in Finance." },
  { id: "figma", name: "Learn Figma", module: "Career", x: 40, y: 220, deps: [], track: "Manual goal." },
  { id: "run5", name: "Run 5 km", module: "Fitness", x: 40, y: 420, deps: [], track: "Completed automatically from a Strava run ≥ 5 km." },
  { id: "cc", name: "Pay off credit card", module: "Finance", x: 290, y: 40, deps: ["ef"], track: "Tracked from the credit card debt in Finance." },
  { id: "port", name: "Build UX portfolio", module: "Career", x: 290, y: 220, deps: ["figma"], track: "3 of 5 case studies done · 2 open Todoist tasks." },
  { id: "run10", name: "Run 10 km", module: "Fitness", x: 290, y: 420, deps: ["run5"], track: "Progress from Strava: longest run 7,2 km (72%). Completes automatically when a run hits 10 km." },
  { id: "duo", name: "Pay off student loan", module: "Finance", x: 540, y: 40, deps: ["cc"], track: "Progress from Finance: 38% paid, € 18.600 remaining." },
  { id: "client", name: "First freelance client", module: "Career", x: 540, y: 220, deps: ["port"], track: "Manual goal." },
  { id: "half", name: "Half marathon", module: "Fitness", x: 540, y: 420, deps: ["run10"], track: "Completes from a Strava run ≥ 21,1 km." },
  { id: "debtfree", name: "Debt-free", module: "Finance", x: 790, y: 40, deps: ["duo"], track: "Completes when all debts in Finance reach € 0." },
  { id: "house", name: "Buy a house", module: "Life", x: 1040, y: 130, deps: ["debtfree", "client"], track: "End goal. Needs both financial freedom and a second income stream." },
];
export const initialGoalsDone: Record<string, boolean> = { ef: true, figma: true, run5: true, cc: true };

/* ---------- Fitness ---------- */

export const fitness = {
  current: { weight: "82,4", weekDelta: "−0,6 this week", intakeToday: "1.640 / 2.200 kcal", intakePct: 74 },
  latestActivity: { name: "Strava · Morning run 6,2 km", kcal: "412 kcal" },
  summary: [
    { label: "Weight · 7-day avg", value: "82,4 kg", note: "−2,7 kg in 12 weeks", tone: "positive" as const },
    { label: "Avg intake · 7 days", value: "2.194 kcal", note: "38% from planned recipes" },
    { label: "Burn at rest (estimate)", value: "1.890 kcal", note: "per day · refined from your data" },
    { label: "Avg daily balance", value: "−483 kcal", note: "≈ −0,4 kg / week", tone: "inverse" as const },
  ],
  weightTrend: {
    points: "40,52 93,60 146,70 198,67 251,85 304,92 356,99 409,114 462,117 515,128 567,135 620,150",
    yLabels: [86, 85, 84, 83, 82, 81],
    xLabels: [
      { x: 40, label: "wk 31" }, { x: 198, label: "wk 34" }, { x: 356, label: "wk 37" },
      { x: 515, label: "wk 40" }, { x: 620, label: "now" },
    ],
  },
  ranges: ["4 wk", "12 wk", "1 yr"],
  restingBurn: [
    { label: "Formula", note: "Mifflin-St Jeor · weight, height, age, sex", value: "1.823" },
    { label: "From your data", note: "weight trend vs intake − Strava, 84 days", value: "1.934" },
  ],
  usedEstimate: { note: "blended · data weighted 60%", value: "1.890" },
  confidence: { label: "good · 81 of 84 days logged", pct: 78 },
  // Bar heights in px on a 170px chart.
  week: [
    { day: "Wed", intake: 112, burned: 124 },
    { day: "Thu", intake: 103, burned: 145 },
    { day: "Fri", intake: 119, burned: 118 },
    { day: "Sat", intake: 99, burned: 145 },
    { day: "Sun", intake: 133, burned: 120 },
    { day: "Mon", intake: 121, burned: 155 },
    { day: "Today", intake: 82, burned: 131, partial: true },
  ],
  activities: [
    { name: "Morning run", meta: "Today · 6,2 km · 34 min", kcal: "412 kcal", icon: icons.fitness },
    { name: "Commute ride", meta: "Mon · 18,4 km · 52 min", kcal: "486 kcal", icon: icons.bike },
    { name: "Strength training", meta: "Sat · 55 min", kcal: "310 kcal", icon: icons.lift },
    { name: "Long run", meta: "Thu · 7,2 km · 41 min", kcal: "498 kcal", icon: icons.fitness },
  ],
  stravaSynced: "14:02",
};
