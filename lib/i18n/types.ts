export type Locale = "he" | "en";

export type Translations = {
  nav: { home: string; overview: string; import: string; settings: string };
  login: {
    title: string; subtitle: string; emailPlaceholder: string;
    passwordPlaceholder: string; signIn: string; signUp: string;
    noAccount: string; hasAccount: string; checkEmail: string; checkEmailBody: string;
  };
  home: {
    expense: string; income: string; notePlaceholder: string;
    saving: string; save: string; enterAmount: string; saved: string;
    date: string; selectDate: string; account: string;
  };
  overview: {
    balance: string; thisMonth: string; allTime: string; whereItWent: string;
    recent: string; noTransactions: string; uncategorised: string;
  };
  settings: {
    title: string; currency: string; language: string; hebrew: string; english: string;
    fastAdd: string; fastAddDesc: string; categories: string;
    siri: string; siriDesc: string; copyEndpoint: string; copied: string; siriSecret: string;
    newCategory: string; expense: string; income: string; add: string; save: string; signOut: string;
    accounts: string; newAccount: string; setDefault: string; default: string;
  };
  import: {
    title: string; subtitle: string; chooseScreenshot: string; chooseHint: string;
    reading: string; uncategorised: string; saving: string; addCount: string;
  };
};
