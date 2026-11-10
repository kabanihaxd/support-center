import { Component } from '@angular/core';
import { BrandLogo } from '@layout/brand-logo';
import { Icon } from '@shared/components/icon/icon';

/** Двухколоночная раскладка страниц входа и регистрации */
@Component({
  selector: 'app-auth-layout',
  imports: [BrandLogo, Icon],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css',
})
export class AuthLayout {
  protected readonly features = [
    'Track every request from creation to resolution',
    'Role-based workspaces for admins, agents and customers',
    'SLA tracking, workload balancing and reports',
  ];
}
