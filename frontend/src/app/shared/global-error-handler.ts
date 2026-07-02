import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;
    const dynamicImportFailed = /Failed to fetch dynamically imported module/;

    if (
      (error?.message && chunkFailedMessage.test(error.message)) ||
      (error?.message && dynamicImportFailed.test(error.message)) ||
      (error?.name === 'ChunkLoadError')
    ) {
      console.warn('ChunkLoadError detectado! Recarregando a página para buscar a nova versão na Vercel...');
      window.location.reload();
      return;
    }

    console.error('Erro Capturado:', error);
  }
}
