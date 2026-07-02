import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type DashboardTab = 'BUSCAR' | 'CHAT_AGENDA' | 'PERFIL';

@Injectable({
  providedIn: 'root'
})
export class DashboardStateService {
  private activeTabSubject = new BehaviorSubject<DashboardTab>('BUSCAR');
  public activeTab$ = this.activeTabSubject.asObservable();

  public get activeTab(): DashboardTab {
    return this.activeTabSubject.getValue();
  }

  public setActiveTab(tab: DashboardTab): void {
    this.activeTabSubject.next(tab);
  }
}
