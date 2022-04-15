import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Server } from '../interface/server';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Status } from '../enum/status.enum';

import { CustomeResponse } from '../interface/custome-response';

@Injectable({
  providedIn: 'root'
})
export class ServerService {

  private readonly apiUrl = 'http://localhost:8080/api'




  constructor(private http: HttpClient) { }

  servers$ = <Observable<CustomeResponse>>this.http.get<CustomeResponse>(`${this.apiUrl}/server/`)
    .pipe(tap(console.log), catchError(this.handleError));

  save$ = (server: Server) => <Observable<CustomeResponse>>this.http.post<CustomeResponse>(`${this.apiUrl}/server/save`, server)
    .pipe(tap(console.log), catchError(this.handleError));


  ping$ = (ipAddress: String) => <Observable<CustomeResponse>>this.http.get<CustomeResponse>(`${this.apiUrl}/server/ping/${ipAddress}`)
    .pipe(tap(console.log), catchError(this.handleError));


  delete$ = (id: number) => <Observable<CustomeResponse>>this.http.delete<CustomeResponse>(`${this.apiUrl}/server/${id}`)
    .pipe(tap(console.log), catchError(this.handleError));


    filter$ = (status: Status , response:CustomeResponse) => <Observable<CustomeResponse>> 
    new Observable<CustomeResponse>(
      subscriber => {
        console.log(response);
        subscriber.next(
          status === Status.ALL ? { ...response , message: `Servers filtered by ${status} status`} : 
          {
            ...response,
            message: response.data.servers
            .filter((server: Server) => server.status === status).length > 0 ? `Servers filtered by 
            ${status === Status.SERVER_UP? 'SERVER  UP' : 'SERVER DOWN'} status` : `No servers of ${status}`,
            data:{ servers: response.data.servers
              .filter((server: Server) => server.status === status)}
          }
        );
        subscriber.complete();
      }
    )


  private handleError(error: HttpErrorResponse): Observable<never> {
    console.log(error)
    return throwError(`An Error occured - Error code: ${error.status}`);

  }

}

