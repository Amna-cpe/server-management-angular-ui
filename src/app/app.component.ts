import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomeResponse } from './interface/custome-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  appState$: Observable<AppState<CustomeResponse>>;
  readonly DataState = DataState;

  private filterSubject = new BehaviorSubject<string>('');

  private dataSubject = new BehaviorSubject<CustomeResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();

  private isLoading = new BehaviorSubject<Boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  hide: Boolean = true;

  toggleHide() {
    this.hide = !this.hide;
  }

  constructor(private serverService: ServerService) {

  }

  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(res => {
          this.dataSubject.next(res);
          return { dataState: DataState.LOADED_STATE, appData: { ...res, data:{ servers:res.data.servers.reverse()}} }
        }),

        startWith({ dataState: DataState.LOADING_STATE }),

        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }


  pingServer(ipAddress: string): void {

    this.filterSubject.next(ipAddress);

    this.appState$ = this.serverService.ping$(ipAddress)
      .pipe(
        map(res => {
          const index = this.dataSubject.value.data.servers.findIndex(server => server.id === res.data.server.id)
          this.dataSubject.value.data.servers[index] = res.data.server;

          //resitting
          this.filterSubject.next("");


          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),

        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

        catchError((error: string) => {
          //resitting
          this.filterSubject.next("");
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }


  filterServers(status: Status): void {

    // const status = value === Status.ALL ? Status.ALL : (value === Status.SERVER_DOWN ? Status.SERVER_DOWN : Status.SERVER_UP)

    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(res => {
          return { dataState: DataState.LOADED_STATE, appData: res }
        }),
        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

        catchError((error: string) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }


  saveServer(serverForm: NgForm): void {
    console.log("the server to be saved is" , serverForm.value)
    this.isLoading.next(true);

    this.appState$ = this.serverService.save$(serverForm.value as Server)
      .pipe(
        map(res => {
          this.dataSubject.next(
            { ...res, data: { servers: [res.data.server, ...this.dataSubject.value.data.servers] } }
          );

          //closing the modal
          this.hide = true;

          serverForm.resetForm({status:Status.SERVER_DOWN})
          this.isLoading.next(false);

          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),

        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

        catchError((error: string) => {
          //resitting
          this.isLoading.next(false);
          this.hide = true;
          console.log("the erros is ", error)
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }


  
  deleteServer(id: number): void {   

    this.appState$ = this.serverService.delete$(id)
      .pipe(
        map(res => {
          this.dataSubject.next(
            { ...res, data: { servers: [...this.dataSubject.value.data.servers.filter(s=>s.id !==id)] } }
          );

          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),

        startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),

        catchError((error: string) => {
         
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  printReport(): void {
    let dataType = '';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }





  title = 'serverapp';
}
