import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot
} from 'firebase/firestore';

let pessoas = {};
let userId = null;
let criterioOrdenacao = 'nome'; // 'nome' ou 'total'
let historico = [];

function pushHistorico(acao, payload) {
  historico.push({ acao, payload });
  if (historico.length > 30) historico.shift(); // Limita tamanho
}

export function iniciarApp(uid) {
  userId = uid;
  const pessoasRef = collection(db, `usuarios/${userId}/pessoas`);
  onSnapshot(pessoasRef, async (snapshot) => {
    pessoas = {};
    for (const docSnap of snapshot.docs) {
      pessoas[docSnap.id] = docSnap.data().registros || [];
    }
    renderLista();
  });
}

async function salvarDados() {
  const pessoasRef = collection(db, `usuarios/${userId}/pessoas`);
  for (const nome of Object.keys(pessoas)) {
    await setDoc(doc(pessoasRef, nome), { registros: pessoas[nome] });
  }
  // Remover pessoas excluídas não é automático, mas pode ser feito se necessário
}

function showToast(msg, cor = '#6366f1') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.background = cor;
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.marginTop = '10px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 2px 8px #0002';
  toast.style.fontWeight = 'bold';
  toast.style.fontSize = '1rem';
  toast.style.opacity = '0.95';
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s';
    toast.style.opacity = '0';
    setTimeout(() => container.removeChild(toast), 500);
  }, 1800);
}

window.adicionarPessoa = async () => {
  const nome = document.getElementById('nomeInput').value.trim();
  if (!nome) {
    showToast('Nome não pode ser vazio!','#b91c1c');
    return;
  }
  if (pessoas[nome]) {
    showToast('Já existe uma pessoa com esse nome!','#b91c1c');
    return;
  }
  pessoas[nome] = [];
  await salvarDados();
  document.getElementById('nomeInput').value = '';
  showToast('Pessoa adicionada!','green');
};

function renderLista() {
  const lista = document.getElementById('pessoas-lista');
  lista.innerHTML = '';
  let totalGeral = 0;
  let nomes = Object.keys(pessoas);
  // Filtro de busca
  const busca = document.getElementById('buscaInput')?.value?.toLowerCase() || '';
  if (busca) {
    nomes = nomes.filter(n => n.toLowerCase().includes(busca));
  }
  // Ordenação
  if (criterioOrdenacao === 'nome') {
    nomes.sort((a, b) => a.localeCompare(b));
  } else if (criterioOrdenacao === 'total') {
    nomes.sort((a, b) => {
      const totalA = pessoas[a].reduce((acc, r) => acc + (!r.naoContabilizar ? Number(r.valor) : 0), 0);
      const totalB = pessoas[b].reduce((acc, r) => acc + (!r.naoContabilizar ? Number(r.valor) : 0), 0);
      return totalB - totalA;
    });
  }
  nomes.forEach((nome) => {
    const pessoaTotal = pessoas[nome].reduce((acc, r) => acc + (!r.naoContabilizar ? Number(r.valor) : 0), 0);
    totalGeral += pessoaTotal;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    const btn = document.createElement('button');
    btn.textContent = nome;
    btn.onclick = () => mostrarDetalhes(nome);
    btn.style.flex = '1';
    btn.style.backgroundColor = '#007bff';
    btn.style.color = 'white';
    const excluir = document.createElement('button');
    excluir.textContent = '🗑️';
    excluir.onclick = () => excluirPessoa(nome);
    excluir.style.backgroundColor = 'red';
    excluir.style.color = 'white';
    div.appendChild(btn);
    div.appendChild(excluir);
    lista.appendChild(div);
  });
  // Exibir total geral
  let totalDiv = document.getElementById('total-geral');
  if (!totalDiv) {
    totalDiv = document.createElement('div');
    totalDiv.id = 'total-geral';
    totalDiv.style.textAlign = 'center';
    totalDiv.style.marginTop = '20px';
    totalDiv.style.fontWeight = 'bold';
    totalDiv.style.color = '#047857';
    lista.parentNode.insertBefore(totalDiv, lista.nextSibling);
  }
  totalDiv.textContent = `Total geral de todos: R$ ${totalGeral.toFixed(2)}`;
}

function mostrarDetalhes(nome) {
  const container = document.getElementById('detalhes');
  const total = pessoas[nome].reduce((acc, r) => acc + (!r.naoContabilizar ? Number(r.valor) : 0), 0);
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 id="nome-pessoa">${nome}</h2>
      <button onclick="editarNomePessoa('${nome}')" title="Editar nome" style="background: transparent; border: none; font-size: 1.2rem; color: #6366f1; cursor: pointer;">✏️</button>
    </div>
    <div style="margin-bottom: 10px; color: #047857; font-weight: bold;">Total: R$ ${total.toFixed(2)}</div>
    <input id="valor" placeholder="Valor pago" type="number" />
    <input id="descricao" placeholder="Descrição" />
    <label style="display:inline-flex;align-items:center;gap:4px;font-size:0.98em;margin-bottom:10px;">
      <input type="checkbox" id="naoContabilizar" /> Não somar este valor no total
    </label>
    <button onclick="adicionarRegistro('${nome}')">Salvar</button>
    <button class='btn-imprimir' onclick="imprimirPessoa('${nome}')">Imprimir ${nome}</button>
    <div id="registros"></div>`;
  renderRegistros(nome);
}

window.editarNomePessoa = async (nomeAntigo) => {
  const novoNome = prompt('Novo nome:', nomeAntigo);
  if (novoNome && novoNome !== nomeAntigo && !pessoas[novoNome]) {
    pessoas[novoNome] = pessoas[nomeAntigo];
    delete pessoas[nomeAntigo];
    await salvarDados();
    renderLista();
    mostrarDetalhes(novoNome);
    pushHistorico('editar-nome', { nomeAntigo, nomeNovo: novoNome });
    showToast('Nome alterado!','green');
  } else if (pessoas[novoNome]) {
    alert('Já existe uma pessoa com esse nome.');
  }
};

window.adicionarRegistro = async (nome) => {
  const valor = document.getElementById('valor').value;
  const descricao = document.getElementById('descricao').value;
  const naoContabilizar = document.getElementById('naoContabilizar')?.checked;
  if (!valor || Number(valor) <= 0) {
    showToast('Valor deve ser maior que zero!','#b91c1c');
    return;
  }
  if (!descricao.trim()) {
    showToast('Descrição não pode ser vazia!','#b91c1c');
    return;
  }
  pessoas[nome].push({ valor, descricao, naoContabilizar: !!naoContabilizar });
  await salvarDados();
  renderRegistros(nome);
  document.getElementById('valor').value = '';
  document.getElementById('descricao').value = '';
  if (document.getElementById('naoContabilizar')) document.getElementById('naoContabilizar').checked = false;
  showToast('Registro adicionado!','green');
};

function renderRegistros(nome) {
  const div = document.getElementById('registros');
  div.innerHTML = '';
  pessoas[nome].forEach((r, i) => {
    const checked = r.naoContabilizar ? 'checked' : '';
    const item = document.createElement('div');
    item.className = 'registro';
    item.innerHTML = `
      <span id="registro-texto-${i}">${i + 1}. R$ ${r.valor} - ${r.descricao} ${r.naoContabilizar ? '<span style=\'color:#b91c1c;font-size:0.95em\'>(não soma)</span>' : ''}</span>
      <div>
        <button class="btn-editar-registro" title="Editar" onclick="editarRegistro('${nome}', ${i})">✏️</button>
        <button class="btn-excluir-registro" onclick="excluirRegistro('${nome}', ${i})">❌</button>
      </div>
    `;
    div.appendChild(item);
  });
}

window.editarRegistro = (nome, i) => {
  const registro = pessoas[nome][i];
  const novoValor = prompt('Novo valor:', registro.valor);
  if (novoValor === null) return;
  if (Number(novoValor) <= 0) {
    showToast('Valor deve ser maior que zero!','#b91c1c');
    return;
  }
  const novaDescricao = prompt('Nova descrição:', registro.descricao);
  if (novaDescricao === null) return;
  if (!novaDescricao.trim()) {
    showToast('Descrição não pode ser vazia!','#b91c1c');
    return;
  }
  const manterNaoContabilizar = confirm('Manter como "não soma no total"? (OK = sim, Cancelar = não)');
  const registroAntigo = { ...registro };
  pessoas[nome][i] = { valor: novoValor, descricao: novaDescricao, naoContabilizar: manterNaoContabilizar ? registro.naoContabilizar : false };
  salvarDados().then(() => {
    renderRegistros(nome);
    pushHistorico('editar-registro', { nome, indice: i, registroAntigo });
    showToast('Registro editado!','green');
  });
};

window.excluirRegistro = async (nome, i) => {
  if (confirm("Excluir esse registro?")) {
    const registro = pessoas[nome][i];
    pessoas[nome].splice(i, 1);
    await salvarDados();
    renderRegistros(nome);
    pushHistorico('excluir-registro', { nome, indice: i, registro });
    showToast('Registro excluído!','#b91c1c');
  }
};

window.excluirPessoa = async (nome) => {
  if (confirm(`Excluir ${nome} e todos os registros?`)) {
    // Remove do Firestore
    const registros = pessoas[nome];
    await deleteDoc(doc(db, `usuarios/${userId}/pessoas`, nome));
    delete pessoas[nome];
    renderLista();
    document.getElementById('detalhes').innerHTML = '';
    pushHistorico('excluir-pessoa', { nome, registros });
    showToast('Pessoa excluída!','#b91c1c');
  }
};

window.imprimirPessoa = (nome) => {
  let texto = `Pagamentos de ${nome}:\n`;
  let total = 0;
  pessoas[nome].forEach((r, i) => {
    texto += `${i + 1}. R$ ${r.valor} - ${r.descricao}${r.naoContabilizar ? ' (não soma)' : ''}\n`;
    if (!r.naoContabilizar) total += Number(r.valor);
  });
  texto += `\nTotal de ${nome}: R$ ${total.toFixed(2)}\n`;
  // Adicionar total geral
  let totalGeral = 0;
  Object.keys(pessoas).forEach((nomeP) => {
    pessoas[nomeP].forEach((r) => {
      if (!r.naoContabilizar) totalGeral += Number(r.valor);
    });
  });
  texto += `Total geral: R$ ${totalGeral.toFixed(2)}\n`;
  const w = window.open('', '', 'width=600,height=400');
  w.document.write(`<pre>${texto}</pre>`);
  w.print();
  w.close();
};

window.imprimirTodos = () => {
  let texto = 'Todos os pagamentos:\n';
  let totalGeral = 0;
  Object.keys(pessoas).forEach((nome) => {
    let totalPessoa = 0;
    texto += `\n${nome}:\n`;
    pessoas[nome].forEach((r, i) => {
      texto += `  ${i + 1}. R$ ${r.valor} - ${r.descricao}${r.naoContabilizar ? ' (não soma)' : ''}\n`;
      if (!r.naoContabilizar) totalPessoa += Number(r.valor);
    });
    texto += `  Total de ${nome}: R$ ${totalPessoa.toFixed(2)}\n`;
    totalGeral += totalPessoa;
  });
  texto += `\nTotal geral: R$ ${totalGeral.toFixed(2)}\n`;
  const w = window.open('', '', 'width=600,height=600');
  w.document.write(`<pre>${texto}</pre>`);
  w.print();
  w.close();
};

window.setOrdenacao = (criterio) => {
  criterioOrdenacao = criterio;
  renderLista();
};

window.setBusca = () => {
  renderLista();
};

window.desfazerUltimaAcao = async () => {
  if (historico.length === 0) {
    showToast('Nada para desfazer!','#b91c1c');
    return;
  }
  const ultima = historico.pop();
  if (ultima.acao === 'excluir-registro') {
    pessoas[ultima.payload.nome].splice(ultima.payload.indice, 0, ultima.payload.registro);
    await salvarDados();
    renderRegistros(ultima.payload.nome);
    showToast('Registro restaurado!','green');
  } else if (ultima.acao === 'excluir-pessoa') {
    pessoas[ultima.payload.nome] = ultima.payload.registros;
    await salvarDados();
    renderLista();
    showToast('Pessoa restaurada!','green');
  } else if (ultima.acao === 'editar-registro') {
    pessoas[ultima.payload.nome][ultima.payload.indice] = ultima.payload.registroAntigo;
    await salvarDados();
    renderRegistros(ultima.payload.nome);
    showToast('Edição desfeita!','green');
  } else if (ultima.acao === 'editar-nome') {
    pessoas[ultima.payload.nomeAntigo] = pessoas[ultima.payload.nomeNovo];
    delete pessoas[ultima.payload.nomeNovo];
    await salvarDados();
    renderLista();
    mostrarDetalhes(ultima.payload.nomeAntigo);
    showToast('Nome restaurado!','green');
  }
};
