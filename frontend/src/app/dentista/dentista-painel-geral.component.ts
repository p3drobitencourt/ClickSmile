import { Component, OnInit, inject, DestroyRef, ChangeDetectorRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FullCalendarModule } from '@fullcalendar/angular';

import { AuthService } from '../auth/auth.service';
import { ChatService, ChatMessageView } from '../services/chat.service';
import { AgendamentoService } from '../services/agendamento';

@Component({
  selector: 'app-dentista-painel-geral',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './dentista-painel-geral.component.html',
  styleUrl: './dentista-painel-geral.component.scss'
})
export class DentistaPainelGeralComponent implements OnInit {
  dentistaId = '';
  isMobile = false;
  showMobileChat = false;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    slotMinTime: '06:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    nowIndicator: true,
    editable: false,
    selectable: true,
    eventClick: this.handleEventClick.bind(this),
    events: []
  };

  activeChats: string[] = [];
  chatRooms: Record<string, { clienteNome: string; messages: ChatMessageView[], clienteId?: string }> = {};
  selectedChatId: string | null = null;
  draftMessage = '';

  private auth = inject(AuthService);
  private agendamentoService = inject(AgendamentoService);
  private chatService = inject(ChatService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.checkMobile();
    this.dentistaId = this.auth.getSubject() ?? '';
    
    if (this.dentistaId) {
      this.loadAgendamentos();
      this.listenToChats();
    }
  }

  private checkMobile() {
    this.isMobile = window.innerWidth < 1024; // lg em Tailwind (1024px)
    if (!this.isMobile) {
      this.showMobileChat = false; // reset
    }
  }

  private loadAgendamentos() {
    this.agendamentoService.listarPorDentista(this.dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (agendamentos) => {
        const events = agendamentos.map(a => ({
          title: a.cliente?.nome ? `Consulta: ${a.cliente.nome}` : 'Consulta Agendada',
          start: a.dataHora,
          // Vamos assumir duração padrão de 30 min se não houver fim (ou se vier da API)
          end: new Date(new Date(a.dataHora).getTime() + 30 * 60000).toISOString(),
          backgroundColor: '#3b82f6', // blue-500
          borderColor: '#2563eb', // blue-600
          textColor: '#ffffff',
          extendedProps: {
            clienteId: a.cliente?.id,
            clienteNome: a.cliente?.nome
          }
        }));
        
        this.calendarOptions = {
          ...this.calendarOptions,
          events
        };
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar agendamentos:', err)
    });
  }

  private listenToChats() {
    this.chatService.connectDentista(this.dentistaId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(update => {
       if (update) {
         if (!this.activeChats.includes(update.roomId)) {
           this.activeChats.push(update.roomId);
           this.chatRooms[update.roomId] = { clienteNome: update.clienteNome, messages: [] };
         }
         this.chatRooms[update.roomId].messages = update.messages;
         this.cdr.detectChanges();
       }
    });

    // Se novas solicitações chegarem, queremos saber
    this.chatService.solicitacoes$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(solicitacoes => {
       solicitacoes.forEach(s => {
         if (this.chatRooms[s.id]) {
            this.chatRooms[s.id].clienteId = s.clienteId;
         }
       });
    });
  }

  handleEventClick(clickInfo: any) {
    const props = clickInfo.event.extendedProps;
    if (props && props.clienteId) {
      // 1. Procurar nas salas ativas se já temos chat com esse clienteId
      // Obs: A estrutura atual indexa por roomId. Precisamos achar a sala com esse clienteId.
      let foundRoomId = null;
      for (const roomId of this.activeChats) {
         if (this.chatRooms[roomId].clienteId === props.clienteId || 
             this.chatRooms[roomId].clienteNome === props.clienteNome) {
             foundRoomId = roomId;
             break;
         }
      }

      if (foundRoomId) {
        this.selectChat(foundRoomId);
      } else {
        // 2. Não encontrou, vamos iniciar/solicitar um chat.
        this.chatService.solicitarChat(props.clienteId, this.dentistaId).subscribe({
          next: (res) => {
             this.selectChat(res.id);
             // Salvar a relação
             if (this.chatRooms[res.id]) {
               this.chatRooms[res.id].clienteId = props.clienteId;
               this.chatRooms[res.id].clienteNome = props.clienteNome;
             }
          },
          error: (err) => console.error('Falha ao iniciar chat com cliente:', err)
        });
      }
    }
  }

  selectChat(chatId: string) {
    this.selectedChatId = chatId;
    if (this.isMobile) {
      this.showMobileChat = true;
    }
    this.cdr.detectChanges();
  }

  closeMobileChat() {
    this.showMobileChat = false;
  }

  sendMessage() {
    if (!this.selectedChatId || !this.draftMessage.trim()) return;
    
    // Procura o clienteId da sala atual
    let recipientId = this.chatRooms[this.selectedChatId].clienteId;
    if (!recipientId) recipientId = this.dentistaId; // Fallback temporário

    this.chatService.send(
      this.selectedChatId,
      this.dentistaId,
      'Dentista',
      recipientId,
      this.draftMessage.trim()
    );
    this.draftMessage = '';
  }
}
