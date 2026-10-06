import { Component, Input } from '@angular/core';
import { LucideAngularModule, Rocket, Sparkles } from 'lucide-angular';

@Component({
  selector: 'app-coming-soon-card-v4',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="flex flex-col items-center justify-center py-3 px-4 text-center">
      <!-- Animated Rocket Illustration -->
      <div class="relative mb-3 animate-float">
        <div class="relative">
          <!-- Main icon container -->
          <div
            class="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
            style="background-color: #004a7c"
          >
            <lucide-icon
              [img]="icons.rocket"
              [size]="26"
              style="color: #00a5b2; transform: rotate(45deg); display: flex"
            ></lucide-icon>
          </div>

          <!-- Sparkle circle -->
          <div
            class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center animate-pulse-sparkle"
            style="background-color: #00a5b2"
          >
            <lucide-icon
              [img]="icons.sparkles"
              [size]="10"
              style="color: #004a7c"
            ></lucide-icon>
          </div>

          <!-- Decorative circle -->
          <div
            class="absolute -bottom-0.5 -left-1.5 w-3 h-3 rounded-full animate-pulse-sparkle"
            style="background-color: rgba(32, 49, 157, 0.2); animation-delay: 0.5s"
          ></div>
        </div>
      </div>

      <!-- Title -->
      <h3 class="text-sm font-bold text-foreground mb-0.5">{{ title }}</h3>

      <!-- Description -->
      <p class="text-xs text-muted-foreground">{{ description }}</p>
    </div>
  `,
  styles: [
    `
      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }

      @keyframes pulse-sparkle {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.2);
          opacity: 1;
        }
      }

      :host {
        display: block;
      }

      :host ::ng-deep .animate-float {
        animation: float 2s ease-in-out infinite;
      }

      :host ::ng-deep .animate-pulse-sparkle {
        animation: pulse-sparkle 1.5s ease-in-out infinite;
      }
    `,
  ],
})
export class ComingSoonCardV4Component {
  @Input() title = 'Coming Soon';
  @Input() description = 'This feature is under development.';

  readonly icons = {
    rocket: Rocket,
    sparkles: Sparkles,
  };
}
