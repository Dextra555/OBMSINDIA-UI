export class EmployeeEpf {
  EmployeeName: string = '';
  EMPICNO: string = '';
  EPFNO: string = '';
  EMPJoinDate: Date = new Date();
  EPFEmployee: number = 0;
  EPFEmployer: number = 0;
  

  // Method to allow partial initialization
  setEmployeeData(data: Partial<EmployeeEpf>): void {
    Object.assign(this, data);
  }
}
