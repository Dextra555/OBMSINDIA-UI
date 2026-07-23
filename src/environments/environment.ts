// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  CompanyPFAccount: 'UM6712345',
  CompanyESIAccount: 'ESI456789',
  CompanyPIC: 'Mr. Sharma',
  CompanyPICContact: '+919876543210',
  CompanyCode: 'OBMSIND',

  CompanyPAN: 'ABCDE1234F',
  CompanyGSTIN: '27ABCDE1234F1ZV',
  CompanyTAN: 'MUM123456A',
  CompanyCIN: 'U74120MH2023PTC123456',
  PayTypePF: "PF",
  PayTypeESI: "ESI",
  PayTypePT: "PT",
  PayTypeTDS: "TDS",

  // Malaysian backward compatibility variables
  CompanyEPF: 'OBMS1234',
  PayTypeEPF: "EPF",
  PayTypeSIP: "SIP",
  PayTypeSOCSO: "SOCSO",
  CompanyRegNumber: '1234567890',
  SocsoCompanyCode: 'SOCSO123',
  BSN_OrganizationCode: 'SBIN0001234',
  BSN_OrganizationName: 'OBMS INDIA PRIVATE LIMITED',
  CIMB_OrganizationCode: 'SBIN0001234',
  CIMB_OrganizationName: 'OBMS INDIA PRIVATE LIMITED',
  CIMB_SecurityCode: '0000000000000000',
  CIMB_BNMCode: '9100000',

  // Indian Bank configuration
  SBI: 'SBI',
  SBI_OrganizationCode: 'SBIN0001234',
  SBI_OrganizationName: 'OBMS INDIA PRIVATE LIMITED',
  SBI_SecurityCode: '0000000000000000',
  SBI_BNMCode: '9100000',

  HDFC: 'HDFC',
  HDFC_OrganizationCode: 'HDFC0001234',
  HDFC_OrganizationName: 'OBMS INDIA PRIVATE LIMITED',
  HDFC_SecurityCode: '0000000000000000',
  HDFC_BNMCode: '9100000',

  ICICI: 'ICICI',
  ICICI_OrganizationCode: 'ICIC0001234',
  ICICI_OrganizationName: 'OBMS INDIA PRIVATE LIMITED',
  ICICI_SecurityCode: '0000000000000000',
  ICICI_BNMCode: '9100000',

  // // //Development Server configuration - Local DEV
  baseUrl: 'http://localhost:5000/api/',
  baseReportUrl:'http://3.239.5.180:80/'

  // Development Server configuration - Local DEV
  // baseUrl: 'http://124.217.236.37:5000/api/',
  // baseReportUrl:'http://124.217.236.37:5222/'

  //Local file access (no server)
  //baseUrl: 'http://localhost:5000/api/',
  //baseReportUrl:'http://localhost:5000/'

  //Local IIS Server configuration
  //IIS Server configuration
  //  baseUrl: 'http://localhost:16787/api/',
  //  baseReportUrl:'http://localhost:58008/'

  //IIS Server configuration
  //  baseUrl: 'http://175.139.216.185:8183/api/',
  //  baseReportUrl:'http://175.139.216.185:8184/'
};

export const TAX = {
  GSTStart5: "2017/07/01",
  GSTEnd5: "9999/12/31",
  GSTStart12: "2017/07/01",
  GSTEnd12: "9999/12/31",
  GSTStart18: "2017/07/01",
  GSTEnd18: "9999/12/31",
  GSTStart28: "2017/07/01",
  GSTEnd28: "9999/12/31",
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
