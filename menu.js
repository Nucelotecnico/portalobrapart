// Função para ativar o botão do cabeçalho baseado na página atual
function ativarBotaoCabecalho() {
  // Obter o nome da página atual
  const paginaAtual = window.location.pathname.split('/').pop() || 'index.html';
  
  // Mapeamento de páginas para IDs de botões
  const mapeamentoPaginas = {
    'index.html': 'btn-home',
    'checklist.html': 'btn-checklist',
    'indices.html': 'btn-indices',
    'seloprojeto.html': 'btn-seloprojeto',
    'fluxos.html': 'btn-fluxos',
    'calendario.html': 'btn-calendario',
    'links.html': 'btn-links',
    'modulos.html': 'btn-modulos',
    'ferramentas.html': 'btn-ferramentas',
    'controlens.html': 'btn-controlens',
    'engenharia.html': 'btn-engenharia',
    'configuracoes.html': 'btn-configuracoes',
    '': 'btn-home' // Se não houver arquivo específico, considera como home
  };
  
  const botaoId = mapeamentoPaginas[paginaAtual];
  
  if (botaoId) {
    const botao = document.getElementById(botaoId);
    if (botao) {
      botao.style.background = 'linear-gradient(145deg, #ff9f68, #ffb088)';
    }
  }
}

// Ativar o botão quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
  ativarBotaoCabecalho();
});
