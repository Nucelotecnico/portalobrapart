const supabaseUrl = (window.SUPABASE_URL || '').trim();
const supabaseAnonKey = (window.SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase config missing: window.SUPABASE_URL / window.SUPABASE_ANON_KEY');
}

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

function mostrarErro(mensagem) {
    const divErro = document.getElementById('mensagem-erro');
    divErro.textContent = '⚠️ ' + mensagem;
    divErro.style.display = 'block';
    setTimeout(() => {
        divErro.style.display = 'none';
    }, 5000);
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('usuario').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const btnLogin = document.getElementById('btnLogin');

    btnLogin.classList.add('loading');
    btnLogin.disabled = true;

    try {
        const { data, error } = await supabaseClient
            .from('user_login_nt')
            .select('*')
            .eq('email', email)
            .eq('senha', senha)
            .single();

        if (error || !data) {
            mostrarErro('Email ou senha incorretos.');
            btnLogin.classList.remove('loading');
            btnLogin.disabled = false;
            return;
        }

        const nomeUsuario = data.nome_usuario || data.email.split('@')[0] || 'Usuário';
        sessionStorage.setItem('userEmail', data.email);
        sessionStorage.setItem('userName', nomeUsuario);
        localStorage.setItem('userName', nomeUsuario);
        sessionStorage.setItem('userCategoria', data.categoria);
        sessionStorage.setItem('userId', data.id);
        sessionStorage.setItem('isLoggedIn', 'true');

        try {
            const { error: logError } = await supabaseClient.from('login_logs_nt').insert([{
                nome_usuario: nomeUsuario,
                email: data.email,
                categoria: data.categoria,
                login_timestamp: new Date().toISOString()
            }]);

            if (logError) {
                console.error('Erro ao inserir log:', logError);
            }
        } catch (logException) {
            console.error('Exceção ao registrar log:', logException);
        }

        btnLogin.textContent = '✓ Login realizado!';
        btnLogin.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

        setTimeout(() => {
            window.location.href = 'calendario.html';
        }, 800);
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        mostrarErro('Erro ao conectar ao servidor. Tente novamente.');
        btnLogin.classList.remove('loading');
        btnLogin.disabled = false;
    }
});

if (sessionStorage.getItem('isLoggedIn') === 'true') {
    window.location.href = 'calendario.html';
}
