import { Component, inject } from '@angular/core';
import { LoomService } from './service/loom.service';

@Component({
  standalone: true,
  selector: 'app-loom',
  templateUrl: './loom.component.html',
  styleUrls: ['./loom.component.scss']
})
export class LoomComponent {
  public loomService = inject(LoomService);
}
