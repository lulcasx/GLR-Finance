const APP_KEY = 'glrFinanceDataV2';
const USERS_KEY = 'glrFinanceUsersV2';
const SESSION_KEY = 'glrFinanceSessionV2';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateFmt = new Intl.DateTimeFormat('pt-BR');

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const defaultData = {
    transacoes: [
        { id: cryptoId(), tipo: 'receita', descricao: 'Salário', categoria: 'Trabalho', valor: 2500, data: today() },
        { id: cryptoId(), tipo: 'despesa', descricao: 'Mercado', categoria: 'Alimentação', valor: 320, data: today() },
        { id: cryptoId(), tipo: 'despesa', descricao: 'Internet', categoria: 'Casa', valor: 99.9, data: today() }
    ],
    metas: [
        { id: cryptoId(), nome: 'Reserva de emergência', alvo: 5000, atual: 1800 },
        { id: cryptoId(), nome: 'Notebook novo', alvo: 3500, atual: 900 }
    ]
};

function cryptoId(){
    return (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function today(){
    return new Date().toISOString().slice(0,10);
}

function getUsers(){
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
}

function setUsers(users){
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(){
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
}

function setSession(user){
    localStorage.setItem(SESSION_KEY, JSON.stringify({ nome: user.nome, email: user.email }));
}

function getData(){
    const saved = JSON.parse(localStorage.getItem(APP_KEY));
    if(saved) return saved;
    localStorage.setItem(APP_KEY, JSON.stringify(defaultData));
    return JSON.parse(JSON.stringify(defaultData));
}

function setData(data){
    localStorage.setItem(APP_KEY, JSON.stringify(data));
}

function toast(msg){
    const el = $('#toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2400);
}

function initAuth(){
    const formCadastro = $('#formCadastro');
    const formLogin = $('#formLogin');
    const demo = $('#entrarDemo');

    formCadastro?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = $('#cadastroNome').value.trim();
        const email = $('#cadastroEmail').value.trim().toLowerCase();
        const senha = $('#cadastroSenha').value;
        const confirmar = $('#cadastroConfirmar').value;
        if(senha !== confirmar) return toast('As senhas não conferem.');
        const users = getUsers();
        if(users.some(u => u.email === email)) return toast('Este e-mail já está cadastrado.');
        const user = { nome, email, senha };
        users.push(user);
        setUsers(users);
        setSession(user);
        toast('Conta criada com sucesso!');
        setTimeout(() => window.location.href = 'index.html', 600);
    });

    formLogin?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = $('#loginEmail').value.trim().toLowerCase();
        const senha = $('#loginSenha').value;
        const user = getUsers().find(u => u.email === email && u.senha === senha);
        if(!user) return toast('E-mail ou senha inválidos.');
        setSession(user);
        window.location.href = 'index.html';
    });

    demo?.addEventListener('click', () => {
        setSession({ nome: 'Lucas', email: 'demo@glrfinance.com' });
    });
}

let filtroAtual = 'todos';

function initDashboard(){
    if(!$('.dashboard')) return;
    const session = getSession();
    if(!session){
        window.location.href = 'login.html';
        return;
    }

    $('#usuarioNome').textContent = session.nome;
    $('#saudacaoUsuario').textContent = session.nome.split(' ')[0];

    $('#btnSair')?.addEventListener('click', () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    });

    $('#formTransacaoInline')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addTransacao({
            tipo: $('#tipoTransacaoInline').value,
            descricao: $('#descricaoInline').value,
            categoria: $('#categoriaInline').value,
            valor: $('#valorInline').value
        });
        e.target.reset();
    });

    $('#formTransacaoModal')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addTransacao({
            tipo: $('#tipoTransacaoModal').value,
            descricao: $('#descricaoModal').value,
            categoria: $('#categoriaModal').value,
            valor: $('#valorModal').value
        });
        e.target.reset();
        closeModals();
    });

    $('#formMeta')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addMeta($('#nomeMeta').value, $('#valorAlvoMeta').value, $('#valorAtualMeta').value);
        e.target.reset();
        closeModals();
    });

    $$('.chip').forEach(btn => btn.addEventListener('click', () => {
        $$('.chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtual = btn.dataset.filter;
        render();
    }));

    $$('[data-open-modal]').forEach(btn => btn.addEventListener('click', () => openModal(btn.dataset.openModal)));
    $$('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeModals));
    $$('.modal').forEach(modal => modal.addEventListener('click', e => { if(e.target === modal) closeModals(); }));
    $('#btnExportar')?.addEventListener('click', exportData);

    render();
}

function addTransacao({ tipo, descricao, categoria, valor }){
    valor = Number(valor);
    if(!descricao.trim() || !categoria.trim() || valor <= 0) return toast('Preencha todos os campos corretamente.');
    const data = getData();
    data.transacoes.unshift({ id: cryptoId(), tipo, descricao: descricao.trim(), categoria: categoria.trim(), valor, data: today() });
    setData(data);
    toast('Movimentação adicionada.');
    render();
}

function removeTransacao(id){
    const data = getData();
    data.transacoes = data.transacoes.filter(t => t.id !== id);
    setData(data);
    toast('Movimentação removida.');
    render();
}

function addMeta(nome, alvo, atual){
    alvo = Number(alvo);
    atual = Number(atual);
    if(!nome.trim() || alvo <= 0 || atual < 0) return toast('Preencha a meta corretamente.');
    const data = getData();
    data.metas.unshift({ id: cryptoId(), nome: nome.trim(), alvo, atual });
    setData(data);
    toast('Meta cadastrada.');
    render();
}

function updateMeta(id, change){
    const data = getData();
    data.metas = data.metas.map(meta => meta.id === id ? { ...meta, atual: Math.max(0, meta.atual + change) } : meta);
    setData(data);
    render();
}

function removeMeta(id){
    const data = getData();
    data.metas = data.metas.filter(m => m.id !== id);
    setData(data);
    toast('Meta removida.');
    render();
}

function render(){
    const data = getData();
    const receitas = data.transacoes.filter(t => t.tipo === 'receita').reduce((acc,t) => acc + t.valor, 0);
    const despesas = data.transacoes.filter(t => t.tipo === 'despesa').reduce((acc,t) => acc + t.valor, 0);
    const saldo = receitas - despesas;
    const economia = receitas > 0 ? Math.max(0, (saldo / receitas) * 100) : 0;

    $('#saldoAtual').textContent = money.format(saldo);
    $('#totalReceitas').textContent = money.format(receitas);
    $('#totalDespesas').textContent = money.format(despesas);
    $('#taxaEconomia').textContent = `${economia.toFixed(0)}%`;
    $('#saldoStatus').textContent = saldo >= 0 ? 'Seu saldo está positivo.' : 'Atenção: saldo negativo.';

    renderTransacoes(data.transacoes);
    renderMetas(data.metas);
    renderGrafico(receitas, despesas, saldo);
}

function renderTransacoes(transacoes){
    const tbody = $('#listaTransacoes');
    const empty = $('#semTransacoes');
    const filtradas = filtroAtual === 'todos' ? transacoes : transacoes.filter(t => t.tipo === filtroAtual);
    tbody.innerHTML = '';
    empty.classList.toggle('show', filtradas.length === 0);
    filtradas.forEach(t => {
        const tr = document.createElement('tr');
        const sinal = t.tipo === 'receita' ? '+' : '-';
        tr.innerHTML = `
            <td><strong>${escapeHtml(t.descricao)}</strong><br><span class="tag">${t.tipo}</span></td>
            <td>${escapeHtml(t.categoria)}</td>
            <td>${dateFmt.format(new Date(t.data + 'T00:00:00'))}</td>
            <td class="amount ${t.tipo}">${sinal} ${money.format(t.valor)}</td>
            <td class="actions"><button class="icon-btn" title="Remover" type="button" data-remove-transacao="${t.id}">×</button></td>
        `;
        tbody.appendChild(tr);
    });
    $$('[data-remove-transacao]').forEach(btn => btn.addEventListener('click', () => removeTransacao(btn.dataset.removeTransacao)));
}

function renderMetas(metas){
    const list = $('#listaMetas');
    const empty = $('#semMetas');
    list.innerHTML = '';
    empty.classList.toggle('show', metas.length === 0);
    metas.forEach(meta => {
        const pct = Math.min(100, (meta.atual / meta.alvo) * 100);
        const div = document.createElement('div');
        div.className = 'goal';
        div.innerHTML = `
            <div class="goal-top">
                <div><strong>${escapeHtml(meta.nome)}</strong><br><small>${money.format(meta.atual)} de ${money.format(meta.alvo)}</small></div>
                <strong>${pct.toFixed(0)}%</strong>
            </div>
            <div class="progress-track"><div class="progress-bar" style="width:${pct}%"></div></div>
            <div class="goal-actions">
                <button class="btn btn-secondary" type="button" data-meta-add="${meta.id}">+ R$100</button>
                <button class="btn btn-ghost" type="button" data-meta-sub="${meta.id}">- R$100</button>
                <button class="btn btn-danger" type="button" data-meta-remove="${meta.id}">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
    $$('[data-meta-add]').forEach(btn => btn.addEventListener('click', () => updateMeta(btn.dataset.metaAdd, 100)));
    $$('[data-meta-sub]').forEach(btn => btn.addEventListener('click', () => updateMeta(btn.dataset.metaSub, -100)));
    $$('[data-meta-remove]').forEach(btn => btn.addEventListener('click', () => removeMeta(btn.dataset.metaRemove)));
}

function renderGrafico(receitas, despesas, saldo){
    const chart = $('#graficoFinanceiro');
    const max = Math.max(receitas, despesas, Math.abs(saldo), 1);
    const items = [
        { label: 'Receitas', value: receitas, className: 'receita' },
        { label: 'Despesas', value: despesas, className: 'despesa' },
        { label: 'Saldo', value: Math.abs(saldo), className: 'saldo' }
    ];
    chart.innerHTML = items.map(item => {
        const h = Math.max(10, (item.value / max) * 90);
        return `<div class="bar ${item.className}" style="height:${h}%" title="${item.label}: ${money.format(item.value)}">${money.format(item.value)}<span>${item.label}</span></div>`;
    }).join('');
}

function openModal(type){
    closeModals();
    const modal = type === 'meta' ? $('#modalMeta') : $('#modalTransacao');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeModals(){
    $$('.modal').forEach(m => {
        m.classList.remove('open');
        m.setAttribute('aria-hidden', 'true');
    });
}

function exportData(){
    const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glr-finance-dados.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Arquivo exportado.');
}

function escapeHtml(text){
    return String(text).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

initAuth();
initDashboard();

if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
}
