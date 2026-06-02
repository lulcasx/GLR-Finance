let saldo =
    Number(localStorage.getItem("saldo")) || 0;

let despesas =
    JSON.parse(localStorage.getItem("despesas")) || [];

let totalReceitas =
    Number(localStorage.getItem("totalReceitas")) || 0;

let totalDespesas =
    Number(localStorage.getItem("totalDespesas")) || 0;

atualizarTela();

function adicionarReceita() {

    let valor =
        Number(
            document.getElementById("receita").value
        );

    if(valor <= 0) return;

    saldo += valor;

    totalReceitas += valor;

    salvar();

    document.getElementById("receita").value = "";
}

function adicionarDespesa() {

    let descricao =
        document.getElementById("descricaoDespesa")
        .value;

    let valor =
        Number(
            document.getElementById("despesa").value
        );

    if(valor <= 0) return;

    saldo -= valor;

    totalDespesas += valor;

    despesas.push({
        descricao,
        valor
    });

    salvar();

    document.getElementById("descricaoDespesa")
        .value = "";

    document.getElementById("despesa")
        .value = "";
}

function salvar() {

    localStorage.setItem(
        "saldo",
        saldo
    );

    localStorage.setItem(
        "despesas",
        JSON.stringify(despesas)
    );

    localStorage.setItem(
        "totalReceitas",
        totalReceitas
    );

    localStorage.setItem(
        "totalDespesas",
        totalDespesas
    );

    atualizarTela();
}

function atualizarTela() {

    document.getElementById("saldoAtual")
        .innerText =
        "R$ " +
        saldo.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        );

    let lista =
        document.getElementById(
            "listaDespesas"
        );

    lista.innerHTML = "";

    despesas.forEach(despesa => {

        let item =
            document.createElement("li");

        item.innerHTML =
            `${despesa.descricao}
            - R$ ${despesa.valor}`;

        lista.appendChild(item);
    });

            document.getElementById(
            "totalReceitas"
        ).innerText =
        "R$ " +
        totalReceitas.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        );

        document.getElementById(
            "totalDespesas"
        ).innerText =
        "R$ " +
        totalDespesas.toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits: 2
            }
        );
}