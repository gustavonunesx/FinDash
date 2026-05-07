(() => {
  // ── Init ──────────────────────────────────────────────────────
  Storage.initDefaults();

  // ── Tab navigation ────────────────────────────────────────────
  const tabs    = document.querySelectorAll('[data-tab]');
  const sections = document.querySelectorAll('.section');

  tabs.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.tab;
      tabs.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('tab-' + target).classList.add('active');
      if (target === 'salario') Calculadora.renderSalario();
      if (target === 'extra')   Calculadora.renderExtra();
      if (target === 'fundos')  Fundos.render();
    });
  });

  // ── Render inicial ────────────────────────────────────────────
  Gastos.render();

  // ── Salário input ─────────────────────────────────────────────
  const salarioInput = document.getElementById('input-salario');
  salarioInput.value = Storage.get('salario') || '';

  salarioInput.addEventListener('input', () => {
    const v = parseFloat(salarioInput.value) || 0;
    Storage.set('salario', v);
    Calculadora.renderSalario();
  });

  // ── Renda Extra input ─────────────────────────────────────────
  const extraInput = document.getElementById('input-extra');
  extraInput.value = Storage.get('extra') || '';

  extraInput.addEventListener('input', () => {
    const v = parseFloat(extraInput.value) || 0;
    Storage.set('extra', v);
    Calculadora.renderExtra();
  });

  // ── Toggle fase ───────────────────────────────────────────────
  const toggleFase = document.getElementById('toggle-fase');
  const faseLabel  = document.getElementById('fase-label');
  const faseHint   = document.getElementById('fase-hint');

  const fase0 = Storage.get('fase') || 'construindo';
  toggleFase.checked = fase0 === 'investindo';
  faseLabel.textContent = fase0 === 'investindo' ? 'Investindo' : 'Construindo reserva';
  faseHint.textContent  = fase0 === 'investindo' ? 'Reserva ≥ R$ 3.600' : 'Reserva < R$ 3.600';

  toggleFase.addEventListener('change', () => {
    const nova = toggleFase.checked ? 'investindo' : 'construindo';
    Storage.set('fase', nova);
    faseLabel.textContent = nova === 'investindo' ? 'Investindo' : 'Construindo reserva';
    faseHint.textContent  = nova === 'investindo' ? 'Reserva ≥ R$ 3.600' : 'Reserva < R$ 3.600';
    Calculadora.renderExtra();
  });

  // ── Evento: gastos atualizados → re-renderiza calculadora ─────
  document.addEventListener('gastos:updated', () => {
    Calculadora.renderSalario();
  });

  // ── Evento: fundos atualizados → re-renderiza extra ───────────
  document.addEventListener('fundos:updated', () => {
    Calculadora.renderExtra();
    Fundos._syncFaseUI(Storage.get('fase') || 'construindo');
  });

  // ── Modal: Gasto ──────────────────────────────────────────────
  const modalGasto     = document.getElementById('modal-gasto');
  const btnNovoGasto   = document.getElementById('btn-novo-gasto');
  const btnCancelarG   = document.getElementById('btn-cancelar-gasto');
  const btnSalvarG     = document.getElementById('btn-salvar-gasto');

  btnNovoGasto.addEventListener('click', () => {
    document.getElementById('modal-gasto-title').textContent = 'Novo Gasto';
    document.getElementById('gasto-edit-id').value  = '';
    document.getElementById('gasto-nome').value     = '';
    document.getElementById('gasto-valor').value    = '';
    document.getElementById('gasto-categoria').value = 'necessidade';
    modalGasto.classList.add('open');
  });

  btnCancelarG.addEventListener('click', () => modalGasto.classList.remove('open'));

  modalGasto.addEventListener('click', e => {
    if (e.target === modalGasto) modalGasto.classList.remove('open');
  });

  btnSalvarG.addEventListener('click', () => {
    const nome      = document.getElementById('gasto-nome').value.trim();
    const valor     = parseFloat(document.getElementById('gasto-valor').value);
    const categoria = document.getElementById('gasto-categoria').value;
    const editId    = document.getElementById('gasto-edit-id').value;

    if (!nome || isNaN(valor) || valor <= 0) {
      alert('Preencha nome e valor corretamente.');
      return;
    }

    if (editId) {
      Gastos.editar(editId, { nome, valor, categoria });
    } else {
      Gastos.adicionar({ nome, valor, categoria });
    }
    modalGasto.classList.remove('open');
  });

  // ── Modal: Fundo ──────────────────────────────────────────────
  const modalFundo   = document.getElementById('modal-fundo');
  const btnNovoFundo = document.getElementById('btn-novo-fundo');
  const btnCancelarF = document.getElementById('btn-cancelar-fundo');
  const btnSalvarF   = document.getElementById('btn-salvar-fundo');

  btnNovoFundo.addEventListener('click', () => {
    document.getElementById('modal-fundo-title').textContent = 'Novo Fundo';
    document.getElementById('fundo-edit-id').value  = '';
    document.getElementById('fundo-nome').value     = '';
    document.getElementById('fundo-saldo').value    = '';
    document.getElementById('fundo-meta').value     = '';
    document.getElementById('fundo-aporte').value   = '';
    modalFundo.classList.add('open');
  });

  btnCancelarF.addEventListener('click', () => modalFundo.classList.remove('open'));

  modalFundo.addEventListener('click', e => {
    if (e.target === modalFundo) modalFundo.classList.remove('open');
  });

  btnSalvarF.addEventListener('click', () => {
    const nome   = document.getElementById('fundo-nome').value.trim();
    const saldo  = parseFloat(document.getElementById('fundo-saldo').value) || 0;
    const meta   = parseFloat(document.getElementById('fundo-meta').value);
    const aporte = parseFloat(document.getElementById('fundo-aporte').value) || 0;
    const editId = document.getElementById('fundo-edit-id').value;

    if (!nome || isNaN(meta) || meta <= 0) {
      alert('Preencha nome e meta corretamente.');
      return;
    }

    if (editId) {
      Fundos.editar(editId, { nome, saldo, meta, aporte });
    } else {
      Fundos.adicionar({ nome, saldo, meta, aporte });
    }
    modalFundo.classList.remove('open');
  });

  // Render inicial da aba ativa (gastos já foi renderizado)
  Calculadora.renderSalario();
})();
