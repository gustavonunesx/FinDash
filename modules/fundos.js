const Fundos = (() => {
  function fmt(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getAll() {
    return Storage.get('fundos') || [];
  }

  function calcularProjecao(f) {
    const restante = f.meta - f.saldo;
    if (restante <= 0) return 0;
    if (!f.aporte || f.aporte <= 0) return Infinity;
    return Math.ceil(restante / f.aporte);
  }

  function _progColor(pct) {
    if (pct >= 100) return 'green';
    if (pct >= 60)  return 'blue';
    if (pct >= 30)  return 'amber';
    return 'red';
  }

  function render() {
    const fundos = getAll();
    const grid   = document.getElementById('grid-fundos');

    if (fundos.length === 0) {
      grid.innerHTML = '<p class="text-subtle">Nenhum fundo cadastrado.</p>';
      return;
    }

    grid.innerHTML = fundos.map(f => {
      const progPct  = Math.min((f.saldo / f.meta) * 100, 100);
      const cor      = _progColor(progPct);
      const meses    = calcularProjecao(f);
      const concluido = f.saldo >= f.meta;

      const projecaoTxt = concluido
        ? ''
        : meses === Infinity
          ? '<div class="fundo-projecao">Sem aporte definido</div>'
          : `<div class="fundo-projecao">Previsão: <strong>${meses} ${meses === 1 ? 'mês' : 'meses'}</strong> com aporte de ${fmt(f.aporte)}/mês</div>`;

      return `
        <div class="fundo-card">
          <div class="fundo-header">
            <div>
              <div class="fundo-name">${escHtml(f.nome)}</div>
              ${concluido ? '<span class="badge badge-success" style="margin-top:4px"><i class="ti ti-check"></i> Concluído</span>' : ''}
            </div>
            <div class="fundo-actions">
              <button onclick="Fundos.abrirEditar('${f.id}')" title="Editar">
                <i class="ti ti-pencil"></i>
              </button>
              <button onclick="Fundos.remover('${f.id}')" title="Remover" style="color:var(--subtle)">
                <i class="ti ti-trash"></i>
              </button>
            </div>
          </div>

          <div class="fundo-saldo">${fmt(f.saldo)}</div>

          <div class="fundo-meta-info">
            <span>Meta: <span class="num">${fmt(f.meta)}</span></span>
            <span>${progPct.toFixed(1)}%</span>
          </div>

          <div class="progress-wrap" style="margin:0">
            <div class="progress-track">
              <div class="progress-fill ${cor}" style="width:${progPct}%"></div>
            </div>
          </div>

          ${projecaoTxt}
        </div>
      `;
    }).join('');

    _checarFaseAuto();
    document.dispatchEvent(new CustomEvent('fundos:updated'));
  }

  function _checarFaseAuto() {
    const fundos  = getAll();
    const reserva = fundos.find(f => f.nome.toLowerCase().includes('reserva'));
    if (!reserva) return;

    const faseAtual = Storage.get('fase');
    const deveria   = reserva.saldo >= 3600 ? 'investindo' : 'construindo';
    if (faseAtual !== deveria) {
      Storage.set('fase', deveria);
      _syncFaseUI(deveria);
    }
  }

  function _syncFaseUI(fase) {
    const toggle = document.getElementById('toggle-fase');
    const label  = document.getElementById('fase-label');
    const hint   = document.getElementById('fase-hint');
    if (!toggle) return;
    toggle.checked = fase === 'investindo';
    label.textContent = fase === 'investindo' ? 'Investindo' : 'Construindo reserva';
    hint.textContent  = fase === 'investindo' ? 'Reserva ≥ R$ 3.600' : 'Reserva < R$ 3.600';
  }

  function adicionar(obj) {
    const fundos = getAll();
    fundos.push({ id: Storage.uid(), ...obj });
    Storage.set('fundos', fundos);
    render();
  }

  function editar(id, obj) {
    const fundos = getAll().map(f => f.id === id ? { ...f, ...obj } : f);
    Storage.set('fundos', fundos);
    render();
  }

  function remover(id) {
    const fundos = getAll().filter(f => f.id !== id);
    Storage.set('fundos', fundos);
    render();
  }

  function abrirEditar(id) {
    const f = getAll().find(f => f.id === id);
    if (!f) return;
    document.getElementById('modal-fundo-title').textContent = 'Editar Fundo';
    document.getElementById('fundo-edit-id').value  = f.id;
    document.getElementById('fundo-nome').value     = f.nome;
    document.getElementById('fundo-saldo').value    = f.saldo;
    document.getElementById('fundo-meta').value     = f.meta;
    document.getElementById('fundo-aporte').value   = f.aporte;
    document.getElementById('modal-fundo').classList.add('open');
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { render, adicionar, editar, remover, abrirEditar, getAll, _syncFaseUI };
})();
