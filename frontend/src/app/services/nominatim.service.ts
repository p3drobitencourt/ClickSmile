import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

@Injectable({ providedIn: 'root' })
export class NominatimService {
  private http = inject(HttpClient);
  // Requisito Nominatim: Use um User-Agent descritivo
  private headers = new HttpHeaders({
    'User-Agent': 'ClickSmile/1.0 contact@clicksmile.com'
  });

  buscarCoordenadas(endereco: string): Observable<NominatimResponse[]> {
    const params = new HttpParams()
      .set('format', 'json')
      .set('q', endereco)
      .set('limit', '1');

    return this.http.get<NominatimResponse[]>('https://nominatim.openstreetmap.org/search', {
      headers: this.headers,
      params: params
    });
  }
}
