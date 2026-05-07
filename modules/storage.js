const KEYS = {
  gastos:  'findash_gastos',
  salario: 'findash_salario',
  extra:   'findash_extra',
  fundos:  'findash_fundos',
  fase:    'findash_fase',
};

const Storage = {
  get(key) {
    const raw = localStorage.getItem(KEYS[key]);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch { return raw; }
  },

  set(key, value) {
    localStorage.setItem(KEYS[key], JSON.stringify(value));
  },

  initDefaults() {
    if (this.get('gastos') === null)  this.set('gastos',  DEFAULTS.gastos);
    if (this.get('salario') === null) this.set('salario', DEFAULTS.salario);
    if (this.get('fundos') === null)  this.set('fundos',  DEFAULTS.fundos);
    if (this.get('fase') === null)    this.set('fase',    DEFAULTS.fase);
    if (this.get('extra') === null)   this.set('extra',   0);
  },

  uid() {
    return '_' + Math.random().toString(36).slice(2, 9);
  },
};
