const Calculadora = (() => {
  function fmt(v) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function pct(v, total) {
    if (!total) return 0;
    return Math.min((v / total) * 100, 100);
  }

  // ── 50/30/20 Salário ──────────────────────────────────────────
  function renderSalario() {
    const salario = Storage.get('salario') || 0;
    const totais  = Gastos.calcularTotais();
    const totalGasto = totais.necessidade + totais.objetivo + totais.qualidade;

    const limNec  = salario * 0.50;
    const limObj  = salario * 0.30;
    const limQual = salario * 0.20;

    // preenche valores alocados (limites)
    document.getElementById('sal-nec-alocado').textContent  = fmt(limNec);
    document.getElementById('sal-nec-limite').textContent   = fmt(limNec);
    document.getElementById('sal-nec-gasto').textContent    = fmt(totais.necessidade);

    document.getElementById('sal-obj-alocado').textContent  = fmt(limObj);
    document.getElementById('sal-obj-minimo').textContent   = fmt(limObj);
    document.getElementById('sal-obj-gasto').textContent    = fmt(totais.objetivo);

    document.getElementById('sal-qual-alocado').textContent = fmt(limQual);
    document.getElementById('sal-qual-gasto').textContent   = fmt(totais.qualidade);

    // percentuais dos gastos sobre o salário
    const pctNec  = salario ? (totais.necessidade / salario * 100) : 0;
    const pctObj  = salario ? (totais.objetivo    / salario * 100) : 0;
    const pctQual = salario ? (totais.qualidade   / salario * 100) : 0;

    document.getElementById('sal-nec-pct').textContent  = pctNec.toFixed(1)  + '%';
    document.getElementById('sal-obj-pct').textContent  = pctObj.toFixed(1)  + '%';
    document.getElementById('sal-qual-pct').textContent = pctQual.toFixed(1) + '%';

    // barras de progresso (base = limite da categoria)
    document.getElementById('prog-nec').style.width  = pct(totais.necessidade, limNec)  + '%';
    document.getElementById('prog-obj').style.width  = pct(totais.objetivo,    limObj)  + '%';
    document.getElementById('prog-qual').style.width = pct(totais.qualidade,   limQual) + '%';

    // status necessidades
    let statusNec, dotNec;
    if (pctNec > 50)      { statusNec = 'Limite ultrapassado!'; dotNec = 'red';   }
    else if (pctNec > 45) { statusNec = 'Atenção — próximo do limite'; dotNec = 'amber'; }
    else                  { statusNec = 'Dentro do limite';     dotNec = 'green'; }

    _setStatus('dot-nec',    'status-nec',    dotNec,  statusNec);
    _setProgColor('prog-nec', dotNec);

    // status objetivos
    let statusObj, dotObj;
    if (pctObj >= 30)     { statusObj = 'Ótimo!';               dotObj = 'green'; }
    else if (pctObj >= 20){ statusObj = 'Razoável';             dotObj = 'amber'; }
    else                  { statusObj = 'Abaixo do recomendado'; dotObj = 'red';  }

    _setStatus('dot-obj', 'status-obj', dotObj, statusObj);

    // alertas
    const alertasEl = document.getElementById('alertas-salario');
    alertasEl.innerHTML = '';
    if (pctNec > 50) {
      alertasEl.innerHTML += _alerta('red', 'ti-alert-triangle',
        `Necessidades comprometeram ${pctNec.toFixed(1)}% do salário — acima do limite de 50%.`);
    } else if (pctNec > 45) {
      alertasEl.innerHTML += _alerta('amber', 'ti-alert-circle',
        `Necessidades em ${pctNec.toFixed(1)}% — próximo do teto de 50%. Atenção.`);
    }
    if (pctObj < 20) {
      alertasEl.innerHTML += _alerta('red', 'ti-alert-triangle',
        `Objetivos abaixo de 20% (${pctObj.toFixed(1)}%) — revise seus aportes.`);
    }

    // saldo livre
    const saldoLivre = salario - totalGasto;
    const slEl = document.getElementById('saldo-livre-val');
    slEl.textContent = fmt(saldoLivre);
    slEl.className   = 'saldo-livre-val ' + (saldoLivre >= 0 ? 'positive' : 'negative');
  }

  // ── 40/30/20/10 Renda Extra ───────────────────────────────────
  function renderExtra() {
    const extra = Storage.get('extra') || 0;
    const fase  = Storage.get('fase') || 'construindo';
    const el    = document.getElementById('blocos-extra');

    if (!extra || extra <= 0) {
      el.innerHTML = '<p class="text-subtle mt-4">Digite um valor de renda extra para ver a distribuição.</p>';
      return;
    }

    let blocos;
    if (fase === 'construindo') {
      blocos = [
        { cor: 'red',   pct: 40, label: 'Reserva de Emergência', val: extra * 0.40 },
        { cor: 'green', pct: 30, label: 'Metas Médio Prazo',      val: extra * 0.30 },
        { cor: 'blue',  pct: 20, label: 'Investimento Longo Prazo', val: extra * 0.20 },
        { cor: 'amber', pct: 10, label: 'Qualidade de Vida',       val: extra * 0.10 },
      ];
    } else {
      blocos = [
        { cor: 'blue',  pct: 45, label: 'Investimento Longo Prazo', val: extra * 0.45 },
        { cor: 'green', pct: 35, label: 'Metas Médio Prazo',        val: extra * 0.35 },
        { cor: 'amber', pct: 20, label: 'Qualidade de Vida',        val: extra * 0.20 },
      ];
    }

    el.innerHTML = `
      <div class="grid-2" style="margin-top:var(--gap)">
        ${blocos.map(b => `
          <div class="bloco-card ${b.cor}">
            <div class="bloco-title">${b.label}</div>
            <div class="bloco-alocado">${fmt(b.val)}</div>
            <div class="bloco-comprometido" style="margin-top:6px">
              ${b.pct}% do valor recebido
            </div>
            <div class="progress-wrap">
              <div class="progress-track">
                <div class="progress-fill ${b.cor}" style="width:100%"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ${_projecaoExtra(extra, fase)}
    `;
  }

  function _projecaoExtra(extra, fase) {
    const fundos = Storage.get('fundos') || [];
    if (!fundos.length) return '';

    const valorReserva = fase === 'construindo' ? extra * 0.40 : 0;
    const valorMedioP  = fase === 'construindo' ? extra * 0.30 : extra * 0.35;

    const linhas = fundos.map(f => {
      const restante = Math.max(f.meta - f.saldo, 0);
      const aporteTotal = f.aporte + (f.nome.toLowerCase().includes('reserva') ? valorReserva : valorMedioP);
      const meses = aporteTotal > 0 ? Math.ceil(restante / aporteTotal) : '∞';
      return `
        <tr>
          <td>${escHtml(f.nome)}</td>
          <td class="td-num">${fmt(f.saldo)}</td>
          <td class="td-num">${fmt(f.meta)}</td>
          <td class="td-num">${fmt(restante)}</td>
          <td class="td-num">${meses === '∞' ? '∞' : meses + ' meses'}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="card mt-5">
        <div class="bloco-title" style="margin-bottom:12px">Projeção com esta Renda Extra</div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fundo</th>
                <th>Saldo Atual</th>
                <th>Meta</th>
                <th>Faltando</th>
                <th>Previsão</th>
              </tr>
            </thead>
            <tbody>${linhas}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function _setStatus(dotId, textId, color, msg) {
    const dot  = document.getElementById(dotId);
    const text = document.getElementById(textId);
    dot.className  = 'dot ' + color;
    text.className = 'status-text ' + color;
    text.textContent = msg;
  }

  function _setProgColor(progId, color) {
    const el = document.getElementById(progId);
    el.className = 'progress-fill ' + color;
  }

  function _alerta(tipo, icon, msg) {
    return `<div class="alert alert-${tipo}"><i class="ti ${icon}"></i><span>${msg}</span></div>`;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { renderSalario, renderExtra };
})();
