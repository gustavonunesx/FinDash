const Gastos = (() => {
  const CAT_LABEL = {
    necessidade: 'Necessidade',
    objetivo:    'Objetivo',
    qualidade:   'Qualidade de Vida',
  };
  const CAT_BADGE = {
    necessidade: 'badge-amber',
    objetivo:    'badge-green',
    qualidade:   'badge-blue',
  };

  function fmt(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function getAll() {
    return Storage.get('gastos') || [];
  }

  function calcularTotais() {
    const gastos = getAll();
    const totais = { necessidade: 0, objetivo: 0, qualidade: 0 };
    for (const g of gastos) totais[g.categoria] += g.valor;
    return totais;
  }

  function render() {
    const gastos = getAll();
    const tbody = document.getElementById('tbody-gastos');

    if (gastos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum gasto cadastrado.</td></tr>';
    } else {
      tbody.innerHTML = gastos.map(g => `
        <tr>
          <td>${escHtml(g.nome)}</td>
          <td><span class="badge ${CAT_BADGE[g.categoria]}">${CAT_LABEL[g.categoria]}</span></td>
          <td class="td-num">${fmt(g.valor)}</td>
          <td style="text-align:right">
            <button class="icon-btn" onclick="Gastos.abrirEditar('${g.id}')" title="Editar">
              <i class="ti ti-pencil"></i>
            </button>
            <button class="icon-btn danger" onclick="Gastos.remover('${g.id}')" title="Remover">
              <i class="ti ti-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    _renderTotais();
    document.dispatchEvent(new CustomEvent('gastos:updated'));
  }

  function _renderTotais() {
    const t = calcularTotais();
    document.getElementById('total-necessidade').textContent = fmt(t.necessidade);
    document.getElementById('total-objetivo').textContent    = fmt(t.objetivo);
    document.getElementById('total-qualidade').textContent   = fmt(t.qualidade);
  }

  function adicionar(obj) {
    const gastos = getAll();
    gastos.push({ id: Storage.uid(), ...obj });
    Storage.set('gastos', gastos);
    render();
  }

  function editar(id, obj) {
    const gastos = getAll().map(g => g.id === id ? { ...g, ...obj } : g);
    Storage.set('gastos', gastos);
    render();
  }

  function remover(id) {
    const gastos = getAll().filter(g => g.id !== id);
    Storage.set('gastos', gastos);
    render();
  }

  function abrirEditar(id) {
    const g = getAll().find(g => g.id === id);
    if (!g) return;
    document.getElementById('modal-gasto-title').textContent = 'Editar Gasto';
    document.getElementById('gasto-edit-id').value   = g.id;
    document.getElementById('gasto-nome').value      = g.nome;
    document.getElementById('gasto-valor').value     = g.valor;
    document.getElementById('gasto-categoria').value = g.categoria;
    document.getElementById('modal-gasto').classList.add('open');
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render, adicionar, editar, remover, abrirEditar, calcularTotais, getAll };
})();
