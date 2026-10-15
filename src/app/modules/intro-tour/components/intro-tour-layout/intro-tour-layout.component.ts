import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IntroHeaderComponent } from '../intro-header/intro-header.component';
import { IntroSidebarComponent } from '../intro-sidebar/intro-sidebar.component';

@Component({
  selector: 'app-intro-tour-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, IntroHeaderComponent, IntroSidebarComponent],
  templateUrl: './intro-tour-layout.component.html',
  styleUrl: './intro-tour-layout.component.scss'
})
export class IntroTourLayoutComponent {}
