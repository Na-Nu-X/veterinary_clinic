import { Pipe, PipeTransform } from '@angular/core';

const priceFormatter = new Intl.NumberFormat('sk-SK', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats a decimal string/number as a Slovak EUR price, e.g. "35 €". */
@Pipe({ name: 'eur' })
export class EurPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(num) ? priceFormatter.format(num) : '';
  }
}

/** Formats minutes as a friendly Slovak duration, e.g. "45 min", "1 h 30 min", "8 h". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
}

/** Splits a multi-paragraph text (blank-line separated) into paragraphs. */
@Pipe({ name: 'paragraphs' })
export class ParagraphsPipe implements PipeTransform {
  transform(text: string | null | undefined): string[] {
    return (text ?? '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
}
