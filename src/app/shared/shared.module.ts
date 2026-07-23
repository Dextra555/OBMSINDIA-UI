// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { twoDecimalPlacesValidator } from '../shared/validators/custom-validators';
import { CurrencyPipe } from '../shared/pipes/currency.pipe';
import { IndianValidators } from '../shared/validators/indian-validators';

@NgModule({
  declarations: [
    CurrencyPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe
  ],
  providers: [
    // Export validator function if needed
    { provide: 'twoDecimalPlacesValidator', useValue: twoDecimalPlacesValidator },
    IndianValidators
  ]
})
export class SharedModule { }
