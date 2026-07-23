import { Component, Input, OnInit } from '@angular/core';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { SidebarService } from 'src/app/service/sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string | null = null;
  constructor(private _dataService: DatasharingService,private sidebarService: SidebarService) {     
  }

  ngOnInit(): void {
    this._dataService.getMenuName().subscribe(menuName => {
     // this.activeMenu = menuName;
      this.activeMenu = this.activeMenu === menuName ? null : menuName; 
    });
  }

  toggleSubmenu(menu: string) {
    this.activeMenu = this.activeMenu === menu ? null : menu;
  }

  isSubmenuOpen(menu: string): boolean {
    return this.activeMenu === menu;
  }
}
