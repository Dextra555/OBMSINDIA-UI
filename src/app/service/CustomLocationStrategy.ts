import { Injectable } from '@angular/core';
import { PlatformLocation, LocationStrategy, HashLocationStrategy } from '@angular/common';

@Injectable()
export class CustomLocationStrategy extends HashLocationStrategy {
  constructor(platformLocation: PlatformLocation) {
    super(platformLocation);
  }

  override prepareExternalUrl(internal: string): string {
    // Replace `#` with 'obms' or any other customization you need.
    return 'obms' + super.prepareExternalUrl(internal).slice(1);
  }

  override path(includeHash: boolean = false): string {
    // Custom path manipulation if needed
    return super.path(includeHash).replace('#', 'obms');
  }
}
