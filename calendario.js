const supabaseUrl = (window.SUPABASE_URL || '').trim();
const supabaseAnonKey = (window.SUPABASE_ANON_KEY || '').trim();

 
       


if (!supabaseUrl || !supabaseAnonKey) {
    alert('Configuração do Supabase não definida. Preencha SUPABASE_URL e SUPABASE_ANON_KEY no cabecalho.html.');
    throw new Error('Supabase config missing: window.SUPABASE_URL / window.SUPABASE_ANON_KEY');
}

const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

const getUserCategoria = () => sessionStorage.getItem('userCategoria');
const isUsuarioCategoria = () => getUserCategoria() === 'usuario';

// Funções de controle da barra de carregamento circular
window.showLoadingBar = function () {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.getElementById('loadingPercent').textContent = '0%';
        document.getElementById('progressCircle').style.strokeDashoffset = '345.575';
    }
};

window.updateLoadingProgress = function (current, total) {
    if (total <= 0) return;
    const percent = Math.round((current / total) * 100);
    const circumference = 345.575; // 2 * π * raio(55)
    const offset = circumference * (1 - (percent / 100));
    
    const percentElement = document.getElementById('loadingPercent');
    const progressCircle = document.getElementById('progressCircle');
    
    if (percentElement) {
        percentElement.textContent = percent + '%';
    }
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
    }
};

window.hideLoadingBar = function () {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

let users = [];

async function loadUsersAndRenderList() {
    showLoadingBar();
    try {
        const { data, error } = await supabaseClient.from('users').select('*');
        if (error) {
            console.error('Erro ao carregar usuários:', error);
            hideLoadingBar();
            return;
        }
        users = data;

        const userSelect = document.getElementById('user');
        userSelect.innerHTML = '';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });

        const userList = document.getElementById('user-list');
        userList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
                        const nameSpan = document.createElement('span');
                        nameSpan.style.color = user.color;
                        nameSpan.style.fontWeight = 'bold';
                        nameSpan.textContent = user.name;

                        const deleteButton = document.createElement('button');
                        deleteButton.className = 'btn-delete-user';
                        deleteButton.dataset.id = user.id;
                        deleteButton.textContent = 'Excluir';

                        li.appendChild(nameSpan);
                        li.appendChild(deleteButton);
            userList.appendChild(li);
        });

        // Simular progresso de carregamento
        updateLoadingProgress(50, 100);
        
        hideLoadingBar();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        hideLoadingBar();
    }
}

// Delegação de eventos para exclusão de usuários
document.addEventListener('click', async function(e) {
    if (e.target && e.target.classList.contains('btn-delete-user')) {
        if (isUsuarioCategoria()) {
            alert('Usuários não têm permissão para excluir usuários.');
            return;
        }

        const userId = e.target.getAttribute('data-id');
        
        // Verificar se usuário tem eventos associados
        const { data: userEvents, error: checkError } = await supabaseClient
            .from('events')
            .select('id')
            .eq('user_id', userId);
        
        if (checkError) {
            console.error('Erro ao verificar eventos:', checkError);
            alert('Erro ao verificar eventos do usuário.');
            return;
        }
        
        let confirmMessage = 'Deseja excluir este usuário?';
        if (userEvents && userEvents.length > 0) {
            confirmMessage = `Este usuário possui ${userEvents.length} evento(s) cadastrado(s).\nAo excluir o usuário, todos os seus eventos serão excluídos também.\n\nDeseja continuar?`;
        }
        
        if (confirm(confirmMessage)) {
            // Primeiro excluir os eventos do usuário
            if (userEvents && userEvents.length > 0) {
                const { error: deleteEventsError } = await supabaseClient
                    .from('events')
                    .delete()
                    .eq('user_id', userId);
                
                if (deleteEventsError) {
                    console.error('Erro ao excluir eventos do usuário:', deleteEventsError);
                    alert('Erro ao excluir eventos do usuário: ' + deleteEventsError.message);
                    return;
                }
            }
            
            // Depois excluir o usuário
            const { error } = await supabaseClient.from('users').delete().eq('id', userId);
            if (error) {
                console.error('Erro ao excluir usuário:', error);
                alert('Erro ao excluir usuário: ' + error.message);
            } else {
                await loadUsersAndRenderList();
                if (typeof window.refreshCalendarViews === 'function') {
                    await window.refreshCalendarViews();
                }
            }
        }
    }
});

document.getElementById('user-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (isUsuarioCategoria()) {
        alert('Usuários não têm permissão para cadastrar usuários.');
        return;
    }

    const name = document.getElementById('user-name').value;
    const color = document.getElementById('user-color').value;

    if (name && color) {
        // #region debug-point A:user-insert-attempt
        fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"calendar-user-create",runId:"pre-fix",hypothesisId:"A",location:"calendario.js:user-form-submit",msg:"[DEBUG] Tentando cadastrar usuario no calendario",data:{name,color},ts:Date.now()})}).catch(()=>{});
        // #endregion
        const { error } = await supabaseClient.from('users').insert([{ name, color }]);
        // #region debug-point B:user-insert-result
        fetch("http://127.0.0.1:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"calendar-user-create",runId:"pre-fix",hypothesisId:"B",location:"calendario.js:user-form-submit",msg:error?"[DEBUG] Supabase retornou erro ao cadastrar usuario":"[DEBUG] Supabase confirmou cadastro de usuario",data:error?{message:error.message,details:error.details,hint:error.hint,code:error.code,name:error.name,status:error.status}:{name,color},ts:Date.now()})}).catch(()=>{});
        // #endregion
        if (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert('Erro ao cadastrar usuário: ' + error.message);
            return;
        }
        document.getElementById('user-form').reset();
        await loadUsersAndRenderList();
        if (typeof window.refreshCalendarViews === 'function') {
            await window.refreshCalendarViews();
        }
    }
});

document.addEventListener('DOMContentLoaded', async function () {
        const form = document.getElementById('event-form');
        const submitButton = document.getElementById('btn-adicionar-evento');
        let editingEventId = null;

        function formatDateForInput(dateValue) {
            const date = new Date(dateValue);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function setCreateMode() {
            editingEventId = null;
            submitButton.textContent = '✓ Adicionar Evento';
        }

        function setEditMode(eventId) {
            editingEventId = eventId;
            submitButton.textContent = '✓ Salvar Alterações';
        }

        // Função para exibir alerta de aniversário
        async function exibirAlertaAniversario() {
            // Buscar todos os eventos
            const { data: eventos, error } = await supabaseClient
                .from('events')
                .select('id,title,type,start_date,end_date,users(name,color)');
            if (error) {
                console.error('Erro ao carregar aniversários:', error);
                return;
            }

            // Data atual normalizada para evitar diferenças por horário
            const hoje = new Date();
            const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

            // Função para remover acentos
            const removeAccents = str => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

            // Log para depuração
            console.log('Eventos retornados:', eventos);
            console.log('Data hoje:', hojeSemHora.toLocaleDateString('pt-BR'));

            // Filtrar aniversários entre hoje e os próximos 7 dias
            const aniversariosProximos = eventos
            .map(ev => {
                if (!ev.type || !ev.start_date) return false;
                const tipo = removeAccents(ev.type).toLowerCase();
                if (tipo !== 'aniversario') return false;

                const [, mes, diaFull] = ev.start_date.split('-');
                const dia = diaFull.split('T')[0];

                let proximoAniversario = new Date(
                    hojeSemHora.getFullYear(),
                    Number(mes) - 1,
                    Number(dia)
                );

                if (proximoAniversario < hojeSemHora) {
                    proximoAniversario = new Date(
                        hojeSemHora.getFullYear() + 1,
                        Number(mes) - 1,
                        Number(dia)
                    );
                }

                const diffMs = proximoAniversario - hojeSemHora;
                const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diasRestantes >= 0 && diasRestantes <= 7) {
                    return { ...ev, diasRestantes };
                }

                return false;
            })
            .filter(Boolean)
            .sort((a, b) => a.diasRestantes - b.diasRestantes);

            console.log('Aniversários nos próximos 7 dias:', aniversariosProximos);
            if (aniversariosProximos.length === 0) {
                document.getElementById('alerta-aniversario').style.display = 'none';
                return;
            }

            const alerta = document.getElementById('alerta-aniversario');
            alerta.innerHTML = '';
            aniversariosProximos.forEach((aniv, idx) => {
                const line = document.createElement('div');
                line.appendChild(document.createTextNode('🎉 '));
                const strong = document.createElement('b');
                strong.textContent = aniv.users?.name || 'Usuário';
                line.appendChild(strong);
                if (aniv.diasRestantes === 0) {
                    line.appendChild(document.createTextNode(' faz aniversário hoje!'));
                } else if (aniv.diasRestantes === 1) {
                    line.appendChild(document.createTextNode(' faz aniversário amanhã!'));
                } else {
                    line.appendChild(document.createTextNode(` faz aniversário em ${aniv.diasRestantes} dias!`));
                }
                alerta.appendChild(line);
                if (idx < aniversariosProximos.length - 1) {
                    alerta.appendChild(document.createElement('br'));
                }
            });
            alerta.style.display = 'block';
            // Esconde o alerta após 5 segundos
            setTimeout(() => {
                alerta.style.display = 'none';
            }, 5000);
        }

        // Chamar ao carregar e sempre que eventos mudarem
        await exibirAlertaAniversario();
    await loadUsersAndRenderList();

    showLoadingBar();

    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        editable: true,
        selectable: true,

        eventDidMount: function(info) {
            // Criar tooltip com informações do evento
            const tooltip = document.createElement('div');
            tooltip.className = 'event-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: white;
                border: 2px solid ${info.event.backgroundColor};
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                display: none;
                min-width: 200px;
                font-size: 14px;
            `;

            // Obter dados do evento original
            const eventData = info.event.extendedProps;
            const startDate = new Date(info.event.start).toLocaleDateString('pt-BR');
            
            // Subtrair 1 dia apenas da data fim
            let endDate = startDate;
            if (info.event.end) {
                const adjustedEnd = new Date(info.event.end);
                adjustedEnd.setDate(adjustedEnd.getDate() - 1);
                endDate = adjustedEnd.toLocaleDateString('pt-BR');
            }

            const header = document.createElement('div');
            header.style.borderBottom = `2px solid ${info.event.backgroundColor}`;
            header.style.paddingBottom = '8px';
            header.style.marginBottom = '8px';
            const titleStrong = document.createElement('strong');
            titleStrong.style.color = info.event.backgroundColor;
            titleStrong.style.fontSize = '16px';
            titleStrong.textContent = eventData.eventTitle || info.event.title;
            header.appendChild(titleStrong);

            const lineTipo = document.createElement('div');
            lineTipo.style.marginBottom = '6px';
            const tipoStrong = document.createElement('strong');
            tipoStrong.textContent = 'Tipo:';
            lineTipo.appendChild(tipoStrong);
            lineTipo.appendChild(document.createTextNode(` ${eventData.eventType || 'Não especificado'}`));

            const lineUsuario = document.createElement('div');
            lineUsuario.style.marginBottom = '6px';
            const usuarioStrong = document.createElement('strong');
            usuarioStrong.textContent = 'Usuário:';
            lineUsuario.appendChild(usuarioStrong);
            lineUsuario.appendChild(document.createTextNode(' '));
            const userSpan = document.createElement('span');
            userSpan.style.color = info.event.backgroundColor;
            userSpan.textContent = eventData.userName || 'Não especificado';
            lineUsuario.appendChild(userSpan);

            const lineInicio = document.createElement('div');
            lineInicio.style.marginBottom = '6px';
            const inicioStrong = document.createElement('strong');
            inicioStrong.textContent = 'Início:';
            lineInicio.appendChild(inicioStrong);
            lineInicio.appendChild(document.createTextNode(` ${startDate}`));

            const lineFim = document.createElement('div');
            const fimStrong = document.createElement('strong');
            fimStrong.textContent = 'Fim:';
            lineFim.appendChild(fimStrong);
            lineFim.appendChild(document.createTextNode(` ${endDate}`));

            tooltip.appendChild(header);
            tooltip.appendChild(lineTipo);
            tooltip.appendChild(lineUsuario);
            tooltip.appendChild(lineInicio);
            tooltip.appendChild(lineFim);

            document.body.appendChild(tooltip);

            // Mostrar tooltip ao passar o mouse
            info.el.addEventListener('mouseenter', function(e) {
                const rect = e.target.getBoundingClientRect();
                tooltip.style.display = 'block';
                tooltip.style.left = (rect.left + window.scrollX) + 'px';
                tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
            });

            // Esconder tooltip ao sair
            info.el.addEventListener('mouseleave', function() {
                tooltip.style.display = 'none';
            });

            // Remover tooltip ao destruir evento
            info.el.addEventListener('DOMNodeRemoved', function() {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
        },

        eventClick: async function (info) {
            const categoria = sessionStorage.getItem('userCategoria');
            if (categoria === 'usuario') {
                alert('Usuários não têm permissão para alterar ou excluir eventos.');
                return;
            }

            const desejaEditar = confirm('Deseja editar este evento?\nClique em "Cancelar" para opção de exclusão.');

            if (desejaEditar) {
                const eventData = info.event.extendedProps;

                document.getElementById('title').value = eventData.eventTitle || '';
                document.getElementById('type').value = eventData.eventType || '';
                document.getElementById('user').value = eventData.eventUserId || '';
                document.getElementById('start').value = formatDateForInput(info.event.start);

                const adjustedEnd = info.event.end ? new Date(info.event.end) : new Date(info.event.start);
                adjustedEnd.setDate(adjustedEnd.getDate() - 1);
                document.getElementById('end').value = formatDateForInput(adjustedEnd);

                setEditMode(info.event.id);
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            if (confirm('Deseja excluir este evento?')) {
                const { error } = await supabaseClient.from('events').delete().eq('id', info.event.id);
                if (error) {
                    console.error('Erro ao excluir evento:', error);
                    alert('Erro ao excluir evento: ' + error.message);
                    return;
                }
                if (typeof window.refreshCalendarViews === 'function') {
                    await window.refreshCalendarViews();
                }
            }
        },

        events: async function (fetchInfo, successCallback, failureCallback) {
            const { data, error } = await supabaseClient
                .from('events')
                .select('id,title,type,user_id,start_date,end_date,users(name,color)');

            if (error) {
                console.error('Erro ao buscar eventos:', error);
                hideLoadingBar();
                return failureCallback(error);
            }

            updateLoadingProgress(75, 100);

            const events = data.map(ev => ({
                id: ev.id,
                title: `${ev.title} - ${ev.users?.name || 'Usuário'}`,
                start: ev.start_date,
                end: ev.end_date,
                backgroundColor: ev.users?.color || '#999',
                extendedProps: {
                    eventTitle: ev.title,
                    eventType: ev.type,
                    eventUserId: ev.user_id,
                    userName: ev.users?.name || 'Usuário'
                }
            }));

            updateLoadingProgress(100, 100);
            successCallback(events);
            hideLoadingBar();
        }
    });

    calendar.render();
    await renderFutureEventsReport();

    window.refreshCalendarViews = async function () {
        calendar.refetchEvents();
        await renderFutureEventsReport();
        await exibirAlertaAniversario();
    };

    supabaseClient
        .channel('events')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => {
            if (typeof window.refreshCalendarViews === 'function') {
                await window.refreshCalendarViews();
            }
        })
        .subscribe();

    // form.addEventListener('submit', async function (e) {
    //     e.preventDefault();
    //     const title = document.getElementById('title').value;
    //     const type = document.getElementById('type').value;
    //     const user_id = document.getElementById('user').value;
    //     const start = document.getElementById('start').value;
    //     const end = document.getElementById('end').value;

    //     if (title && type && user_id && start && end) {
    //         const adjustedEnd = new Date(end);
    //         adjustedEnd.setDate(adjustedEnd.getDate() + 1);

    //         await supabaseClient.from('events').insert([{
    //             title,
    //             type,
    //             user_id,
    //             start_date: start,
    //             end_date: adjustedEnd.toISOString().split('T')[0]
    //         }]);
    //         form.reset();
    //         calendar.refetchEvents();
    //         await renderFutureEventsReport();
    //         await exibirAlertaAniversario();
    //     }
    // });

    form.addEventListener('submit', async function (e) {
    e.preventDefault(); // Impede envio padrão sempre

    if (isUsuarioCategoria()) {
        alert('Usuários não têm permissão para cadastrar eventos.');
        return;
    }

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const user_id = document.getElementById('user').value;
    const start = document.getElementById('start').value;
    const end = document.getElementById('end').value;

    // Extrai o ano dos campos de data
    const startYear = start ? start.split('-')[0] : '';
    const endYear = end ? end.split('-')[0] : '';

    // Validação: só permite 4 dígitos
    if (!/^\d{4}$/.test(startYear) || !/^\d{4}$/.test(endYear)) {
        alert("O campo de ano deve conter exatamente 4 dígitos.");
        return;
    }

    // Validação: data de início não pode ser superior à data de fim
    if (start && end) {
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        if (startDateObj > endDateObj) {
            alert("A data de início não pode ser superior à data de fim.");
            return;
        }
    }

    // Só executa o cadastro se todas as validações forem aprovadas
    if (title && type && user_id && start && end) {
        const adjustedEnd = new Date(end);
        adjustedEnd.setDate(adjustedEnd.getDate() + 1);

        let error = null;

        if (editingEventId) {
            const response = await supabaseClient
                .from('events')
                .update({
                    title,
                    type,
                    user_id,
                    start_date: start,
                    end_date: adjustedEnd.toISOString().split('T')[0]
                })
                .eq('id', editingEventId);
            error = response.error;
        } else {
            const response = await supabaseClient.from('events').insert([{
                title,
                type,
                user_id,
                start_date: start,
                end_date: adjustedEnd.toISOString().split('T')[0]
            }]);
            error = response.error;
        }

        if (error) {
            const acao = editingEventId ? 'alterar' : 'cadastrar';
            console.error(`Erro ao ${acao} evento:`, error);
            alert(`Erro ao ${acao} evento: ` + error.message);
            return;
        }

        form.reset();
        setCreateMode();
        if (typeof window.refreshCalendarViews === 'function') {
            await window.refreshCalendarViews();
        }
    }
});

    function formatDateBR(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    async function renderFutureEventsReport() {
        showLoadingBar();
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabaseClient
                .from('events')
                .select('title,type,start_date,end_date,users(name,color)')
                .gte('end_date', today);

            if (error) {
                console.error('Erro ao buscar eventos futuros e vigentes:', error);
                hideLoadingBar();
                return;
            }

            updateLoadingProgress(50, 100);

            // Ordena os eventos pelo start_date (data de início)
            data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

            const list = document.getElementById('future-events-list');
            list.innerHTML = '';

            if (data.length === 0) {
                const emptyItem = document.createElement('li');
                emptyItem.textContent = 'Nenhum evento futuro ou vigente encontrado.';
                list.appendChild(emptyItem);
                hideLoadingBar();
                return;
            }

            function formatDateOnly(dateStr) {
                // Remove time if present and format as dd/mm/yyyy
                const [year, month, day] = dateStr.split('T')[0].split('-');
                return `${day}/${month}/${year}`;
            }

            function getAdjustedEndDate(dateStr) {
                // Subtract one day from end_date for display
                const date = new Date(dateStr);
                date.setDate(date.getDate() - 1);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${day}/${month}/${year}`;
            }

            data.forEach(ev => {
                const li = document.createElement('li');

                const titleStrong = document.createElement('strong');
                titleStrong.style.color = ev.users?.color || '#333';
                titleStrong.textContent = ev.title;
                li.appendChild(titleStrong);

                li.appendChild(document.createTextNode(` (${ev.type}) - ${ev.users?.name || 'Usuário'}`));
                li.appendChild(document.createElement('br'));
                li.appendChild(document.createTextNode(`De ${formatDateOnly(ev.start_date)} até ${getAdjustedEndDate(ev.end_date)}`));

                list.appendChild(li);
            });

            updateLoadingProgress(100, 100);
            hideLoadingBar();
        } catch (error) {
            console.error('Erro ao renderizar relatório:', error);
            hideLoadingBar();
        }
    }
});


document.getElementById('toggle-users-btn').addEventListener('click', function () {
    const userDiv = document.getElementById('user-manager');
    userDiv.style.display = userDiv.style.display === 'none' ? 'block' : 'none';
});
