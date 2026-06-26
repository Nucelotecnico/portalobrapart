const supabaseUrl = (window.SUPABASE_URL || '').trim();
const supabaseAnonKey = (window.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
    alert('Configuracao do Supabase nao definida. Preencha SUPABASE_URL e SUPABASE_ANON_KEY no supabase-config.js.');
    throw new Error('Supabase config missing: window.SUPABASE_URL / window.SUPABASE_ANON_KEY');
}

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

function normalizeCategoria(categoria) {
    const value = (categoria || 'usuario').toString().trim().toLowerCase();
    if (value === 'admin' || value === 'tecnico' || value === 'usuario') return value;
    return 'usuario';
}

function renderBadge(categoria) {
    const normalized = normalizeCategoria(categoria);
    const label = normalized.toUpperCase();
    return `<span class="badge badge--${normalized}">${label}</span>`;
}

function setResultado(state, html) {
    const resultadoDiv = document.getElementById('resultadoTeste');
    resultadoDiv.classList.remove('is-hidden', 'result--warning', 'result--error', 'result--success');

    if (!state) {
        resultadoDiv.classList.add('is-hidden');
        resultadoDiv.innerHTML = '';
        return;
    }

    resultadoDiv.classList.add(`result--${state}`);
    resultadoDiv.innerHTML = html;
}

function formatarData(dataISO) {
    if (!dataISO) return 'N/A';

    const match = dataISO.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!match) return dataISO;

    let [_, ano, mes, dia, hora, minuto, segundo] = match;
    hora = parseInt(hora, 10);
    hora -= 3;

    if (hora < 0) {
        hora += 24;
        dia = parseInt(dia, 10) - 1;
        if (dia < 1) {
            dia = 1;
        }
        dia = dia.toString().padStart(2, '0');
    }

    hora = hora.toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

window.toggleLogs = async function () {
    const logsSection = document.getElementById('logsSection');
    const toggleBtn = document.getElementById('toggleLogsBtn');
    const isHidden = logsSection.classList.contains('is-hidden');

    if (isHidden) {
        logsSection.classList.remove('is-hidden');
        toggleBtn.textContent = '📊 Ocultar Logs de Acesso';
        toggleBtn.classList.add('btn-toggle-logs--open');
        await loadLoginLogs();
    } else {
        logsSection.classList.add('is-hidden');
        toggleBtn.textContent = '📊 Exibir Logs de Acesso';
        toggleBtn.classList.remove('btn-toggle-logs--open');
    }
};

async function loadLoginLogs() {
    const logTableBody = document.querySelector('#logTable tbody');
    const logCount = document.getElementById('logCount');

    try {
        const { data, error } = await supabaseClient.from('login_logs_nt')
            .select('nome_usuario, email, categoria, login_timestamp')
            .order('login_timestamp', { ascending: false })
            .limit(100);

        if (error) {
            throw error;
        }

        logTableBody.innerHTML = '';

        if (!data || data.length === 0) {
            logTableBody.innerHTML = '<tr><td colspan="4" class="cell-message cell-message--muted">Nenhum log de acesso registrado</td></tr>';
            logCount.textContent = 'Total: 0 acessos registrados';
            return;
        }

        logCount.textContent = `Total: ${data.length} acesso(s) registrado(s) (ultimos 100)`;

        data.forEach((log) => {
            const row = document.createElement('tr');
            const categoria = normalizeCategoria(log.categoria);
            row.innerHTML = `
                <td>${log.nome_usuario || 'N/A'}</td>
                <td class="cell-email">${log.email}</td>
                <td>${renderBadge(categoria)}</td>
                <td>${formatarData(log.login_timestamp)}</td>
            `;
            logTableBody.appendChild(row);
        });
    } catch (error) {
        let errorMsg = error.message;
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            errorMsg = 'Tabela "login_logs_nt" nao encontrada. Execute o SQL no Supabase primeiro!';
        }
        logTableBody.innerHTML = `<tr><td colspan="4" class="cell-message cell-message--error">❌ Erro ao carregar logs: ${errorMsg}<br><br><small>Verifique o console (F12) para mais detalhes</small></td></tr>`;
        logCount.textContent = 'Erro ao carregar logs';
    }
}

document.getElementById('formTestadorLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('emailTeste').value.trim().toLowerCase();
    const senha = document.getElementById('senhaTeste').value;
    try {
        setResultado('warning', '⏳ Verificando credenciais...');

        const { data, error } = await supabaseClient
            .from('user_login_nt')
            .select('id, nome_usuario, email, categoria, matricula')
            .eq('email', email)
            .eq('senha', senha)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                setResultado('error', '❌ <strong>Login falhou!</strong><br>Email ou senha incorretos.');
            } else {
                setResultado('error', '❌ <strong>Erro:</strong> ' + error.message);
            }
        } else if (data) {
            try {
                const { error: logError } = await supabaseClient.from('login_logs_nt').insert([{
                    nome_usuario: data.nome_usuario,
                    email: data.email,
                    categoria: data.categoria,
                    login_timestamp: new Date().toISOString()
                }]);

                if (logError) {
                    console.error('Erro ao inserir log:', logError);
                }
            } catch (logException) {
                console.error('Excecao ao registrar log:', logException);
            }

            const categoria = normalizeCategoria(data.categoria);
            setResultado('success', `
                ✅ <strong>Login bem-sucedido!</strong><br>
                <strong>Nome:</strong> ${data.nome_usuario}<br>
                <strong>Email:</strong> ${data.email}<br>
                <strong>Matrícula:</strong> ${data.matricula}<br>
                <strong>Categoria:</strong> ${renderBadge(categoria)}
            `);
        }
    } catch (error) {
        console.error('Erro ao testar login:', error);
        setResultado('error', '❌ <strong>Erro ao testar login:</strong> ' + error.message);
    }
});

async function carregarUsuarios() {
    try {
        const { data, error } = await supabaseClient
            .from('user_login_nt')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('usuarios-tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="cell-message cell-message--muted">Nenhum usuário cadastrado</td></tr>';
            return;
        }

        data.forEach((usuario) => {
            const tr = document.createElement('tr');
            const categoria = normalizeCategoria(usuario.categoria);
            tr.innerHTML = `
                <td>${usuario.nome_usuario || ''}</td>
                <td>${usuario.matricula || ''}</td>
                <td class="cell-email">${usuario.email}</td>
                <td>${usuario.telefone || ''}</td>
                <td>${usuario.data_nasc ? new Date(usuario.data_nasc).toLocaleDateString('pt-BR') : ''}</td>
                <td>${renderBadge(categoria)}</td>
                <td>${new Date(usuario.created_at).toLocaleString('pt-BR')}</td>
                <td class="cell-actions">
                    <button class="btn-action btn-action--edit btn-editar" data-id="${usuario.id}" data-nome="${usuario.nome_usuario || ''}" data-matricula="${usuario.matricula || ''}" data-email="${usuario.email}" data-telefone="${usuario.telefone || ''}" data-data-nasc="${usuario.data_nasc || ''}" data-categoria="${usuario.categoria}">Editar</button>
                    <button class="btn-action btn-action--delete btn-excluir" data-id="${usuario.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar usuarios:', error);
        document.getElementById('usuarios-tbody').innerHTML = `<tr><td colspan="8" class="cell-message cell-message--error">Erro ao carregar usuários: ${error.message}</td></tr>`;
    }
}

document.addEventListener('click', async function (e) {
    if (e.target && e.target.classList.contains('btn-editar')) {
        const id = e.target.getAttribute('data-id');
        document.getElementById('usuarioId').value = id;
        document.getElementById('nomeUsuario').value = e.target.getAttribute('data-nome') || '';
        document.getElementById('matricula').value = e.target.getAttribute('data-matricula') || '';
        document.getElementById('email').value = e.target.getAttribute('data-email') || '';
        document.getElementById('telefone').value = e.target.getAttribute('data-telefone') || '';
        document.getElementById('dataNasc').value = (e.target.getAttribute('data-data-nasc') || '').split('T')[0];
        document.getElementById('categoria').value = e.target.getAttribute('data-categoria') || 'usuario';
        document.getElementById('btnSalvar').textContent = 'Salvar alteracoes';
        document.getElementById('btnCancelarEdicao').classList.remove('is-hidden');
        return;
    }

    if (e.target && e.target.classList.contains('btn-excluir')) {
        const id = e.target.getAttribute('data-id');

        if (!confirm('Tem certeza que deseja excluir este usuario?')) return;

        try {
            const { error } = await supabaseClient
                .from('user_login_nt')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('Usuario excluido com sucesso!');
            carregarUsuarios();
        } catch (error) {
            console.error('Erro ao excluir usuario:', error);
            alert('Erro ao excluir usuario: ' + error.message);
        }
    }
});

document.getElementById('btnCancelarEdicao').addEventListener('click', function () {
    document.getElementById('form').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('btnSalvar').textContent = 'Cadastrar';
    this.classList.add('is-hidden');
});

document.getElementById('form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuarioId = document.getElementById('usuarioId').value;
    const nomeUsuario = document.getElementById('nomeUsuario').value.trim();
    const matricula = document.getElementById('matricula').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const telefone = document.getElementById('telefone').value.trim();
    const dataNasc = document.getElementById('dataNasc').value;
    const senha = document.getElementById('senha').value;
    const categoria = document.getElementById('categoria').value;

    try {
        if (usuarioId) {
            const { error } = await supabaseClient
                .from('user_login_nt')
                .update({
                    nome_usuario: nomeUsuario,
                    matricula,
                    email,
                    telefone,
                    data_nasc: dataNasc,
                    senha,
                    categoria
                })
                .eq('id', usuarioId);

            if (error) throw error;

            alert('Usuario atualizado com sucesso!');
        } else {
            const { error } = await supabaseClient
                .from('user_login_nt')
                .insert([{
                    nome_usuario: nomeUsuario,
                    matricula,
                    email,
                    telefone,
                    data_nasc: dataNasc,
                    senha,
                    categoria
                }])
                .select();

            if (error) throw error;
            alert('Usuario cadastrado com sucesso!');
        }

        document.getElementById('form').reset();
        document.getElementById('usuarioId').value = '';
        document.getElementById('btnSalvar').textContent = 'Cadastrar';
        document.getElementById('btnCancelarEdicao').classList.add('is-hidden');
        carregarUsuarios();
    } catch (error) {
        console.error('Erro ao cadastrar usuario:', error);
        alert('Erro ao cadastrar usuario: ' + error.message);
    }
});

window.addEventListener('load', carregarUsuarios);
