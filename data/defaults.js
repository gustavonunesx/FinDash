const DEFAULTS = {
  salario: 1700,
  fase: 'construindo',
  gastos: [
    { id: 'g1', nome: 'Faculdade',             valor: 529.00,  categoria: 'necessidade' },
    { id: 'g2', nome: 'Gasolina',              valor: 100.00,  categoria: 'necessidade' },
    { id: 'g3', nome: 'Academia',              valor: 109.90,  categoria: 'necessidade' },
    { id: 'g4', nome: 'Cabelo',                valor: 35.00,   categoria: 'necessidade' },
    { id: 'g5', nome: 'Recorrente 1',          valor: 39.70,   categoria: 'necessidade' },
    { id: 'g6', nome: 'Recorrente 2',          valor: 47.94,   categoria: 'necessidade' },
    { id: 'g7', nome: 'Reserva de Emergência', valor: 300.00,  categoria: 'objetivo'    },
    { id: 'g8', nome: 'Alianças',              valor: 200.00,  categoria: 'objetivo'    },
  ],
  fundos: [
    { id: 'f1', nome: 'Reserva de Emergência', saldo: 298.11, meta: 3600, aporte: 300 },
    { id: 'f2', nome: 'Alianças',              saldo: 493.43, meta: 2000, aporte: 200 },
    { id: 'f3', nome: 'Fundo PC',              saldo: 50.00,  meta: 2000, aporte: 200 },
  ],
};
