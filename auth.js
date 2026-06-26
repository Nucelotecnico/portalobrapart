// Sistema de autenticação
(function() {
    // Verificar se está na página de login
    const isLoginPage = window.location.pathname.includes('index.html');
    
    // Se não estiver logado e não for a página de login, redirecionar
    if (!isLoginPage && sessionStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    // Função de logout
    window.logout = function() {
        if (confirm('Deseja realmente sair?')) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    };

    // Adicionar informações do usuário logado (opcional)
    window.getUserInfo = function() {
        return {
            email: sessionStorage.getItem('userEmail'),
            categoria: sessionStorage.getItem('userCategoria'),
            id: sessionStorage.getItem('userId')
        };
    };

    // Controlar acesso ao botão de configurações
    window.addEventListener('DOMContentLoaded', function() {
        const btnConfiguracoes = document.getElementById('btn-configuracoes');
        const categoria = sessionStorage.getItem('userCategoria');
        
        if (btnConfiguracoes && categoria !== 'admin') {
            btnConfiguracoes.style.display = 'none';
        }

        // Controlar acesso a funcionalidades do calendário para usuário comum
        if (categoria === 'usuario') {
            // Ocultar gerenciamento de usuários
            const toggleUsersBtn = document.getElementById('toggle-users-btn');
            const userContainer = document.getElementById('user-container');
            if (toggleUsersBtn) toggleUsersBtn.style.display = 'none';
            if (userContainer) userContainer.style.display = 'none';

            // Ocultar formulário de adicionar eventos
            const formContainer = document.getElementById('form-container');
            if (formContainer) formContainer.style.display = 'none';

            // Desabilitar botões de adicionar usuário e evento
            const btnCadastrarUsuario = document.getElementById('btn-cadastrar-usuario');
            const btnAdicionarEvento = document.getElementById('btn-adicionar-evento');
            if (btnCadastrarUsuario) btnCadastrarUsuario.disabled = true;
            if (btnAdicionarEvento) btnAdicionarEvento.disabled = true;

            // Centralizar e aumentar o calendário
            const calendar = document.getElementById('calendar');
            const containerGeral = document.getElementById('containergeral');
            if (calendar) {
                calendar.style.flex = '1';
                calendar.style.maxWidth = '90%';
                calendar.style.margin = '0 auto';
            }
            if (containerGeral) {
                containerGeral.style.justifyContent = 'center';
                containerGeral.style.padding = '20px';
            }
        }
    });
})();
