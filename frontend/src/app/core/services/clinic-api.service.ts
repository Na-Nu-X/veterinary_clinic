import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiFieldErrors,
  AppointmentPayload,
  AppointmentResponse,
  Department,
  PrescriptionPayload,
  PrescriptionResponse,
  ServiceQuery,
  Veterinarian,
  VeterinaryService,
  VeterinaryServiceDetail,
} from '../models/clinic.models';

@Injectable({ providedIn: 'root' })
export class ClinicApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/departments/`);
  }

  getServices(query: ServiceQuery = {}): Observable<VeterinaryService[]> {
    let params = new HttpParams();
    if (query.department) params = params.set('department', query.department);
    if (query.featured !== undefined) params = params.set('featured', String(query.featured));
    if (query.search) params = params.set('search', query.search);
    if (query.ordering) params = params.set('ordering', query.ordering);
    return this.http.get<VeterinaryService[]>(`${this.baseUrl}/services/`, { params });
  }

  getService(slug: string): Observable<VeterinaryServiceDetail> {
    return this.http.get<VeterinaryServiceDetail>(`${this.baseUrl}/services/${encodeURIComponent(slug)}/`);
  }

  getVeterinarians(): Observable<Veterinarian[]> {
    return this.http.get<Veterinarian[]>(`${this.baseUrl}/veterinarians/`);
  }

  createAppointment(payload: AppointmentPayload): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments/`, payload);
  }

  createPrescriptionRequest(payload: PrescriptionPayload): Observable<PrescriptionResponse> {
    return this.http.post<PrescriptionResponse>(`${this.baseUrl}/prescriptions/`, payload);
  }
}

/** Normalises an HTTP error into a friendly Slovak message + optional field errors. */
export function describeApiError(error: unknown): { message: string; fields: ApiFieldErrors } {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return {
        message: 'Nepodarilo sa spojiť so serverom. Skontrolujte pripojenie na internet alebo nám, prosím, zavolajte.',
        fields: {},
      };
    }
    if (error.status === 400 && error.error && typeof error.error === 'object') {
      const fields: ApiFieldErrors = {};
      for (const [key, value] of Object.entries(error.error as Record<string, unknown>)) {
        fields[key] = Array.isArray(value) ? value.map(String) : [String(value)];
      }
      return { message: 'Skontrolujte, prosím, zvýraznené údaje vo formulári.', fields };
    }
    if (error.status === 429) {
      return {
        message: 'Odoslali ste príliš veľa žiadostí za krátky čas. Skúste to o chvíľu znova alebo nám zavolajte.',
        fields: {},
      };
    }
  }
  return {
    message: 'Ospravedlňujeme sa, niečo sa pokazilo. Skúste to, prosím, znova alebo nás kontaktujte telefonicky.',
    fields: {},
  };
}
