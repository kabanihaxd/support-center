import { DOCUMENT, inject, Service } from '@angular/core';

/** Скачивание сгенерированного файла (CSV) через временную ссылку */
@Service()
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);

  download(fileName: string, content: string, mimeType = 'text/csv;charset=utf-8'): void {
    // BOM, чтобы Excel правильно определил UTF-8
    const blob = new Blob(['﻿', content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = this.document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    this.document.body.append(link);
    link.click();
    link.remove();
    // Даём браузеру начать загрузку, потом освобождаем память
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
