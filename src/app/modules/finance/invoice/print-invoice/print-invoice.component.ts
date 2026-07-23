import { Component, OnInit } from '@angular/core';
import { FinanceService } from "../../../../service/finance.service";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-print-invoice',
  templateUrl: './print-invoice.component.html',
  styleUrls: ['./print-invoice.component.css']
})
export class PrintInvoiceComponent implements OnInit {

  invoiceData: any;
  client: any;
  details: any;
  invoice: any;
  taxRate: string = '18% GST';
  taxLabel: string = '18% GST';


  constructor(private service: FinanceService, private _activatedRoute: ActivatedRoute,) {

    this._activatedRoute.queryParams.subscribe((params) => {
      if (params['invoiceId'] != undefined) {

        service.GetPrintInvoice(params['invoiceId']).subscribe((d: any) => {
          console.log(d);
          this.invoiceData = d;
          this.client = d['client'];
          this.details = d['details'];
          this.invoice = d['invoice'];

          // Determine tax rate based on client state or branch
          // Malaysia uses SST 8%, India uses GST 18%
          const clientState = this.client?.State?.toLowerCase() || '';
          const branchState = this.invoice?.Branch?.toLowerCase() || '';

          if (clientState.includes('malaysia') || branchState.includes('malaysia') ||
            clientState.includes('selangor') || clientState.includes('kuala lumpur') ||
            clientState.includes('negeri sembilan') || clientState.includes('seremban')) {
            this.taxRate = '8%';
            this.taxLabel = 'SST 8%';
          } else {
            this.taxRate = '18%';
            this.taxLabel = '18% GST';
          }
        })

      }
    });


  }

  print() {
    window.print();
  }

  ngOnInit(): void {
  }

  public formatDisplayDate(date: any) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  returnMonthAndYear(date?: any) {
    let currentDate = new Date();
    if (date) {
      currentDate = new Date(date);
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;


    const monthString = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, month - 1, 1));
    return `${monthString} ${year}`;
  }
}

