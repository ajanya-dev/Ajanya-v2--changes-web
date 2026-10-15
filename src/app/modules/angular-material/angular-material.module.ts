import { MatTableModule } from '@angular/material/table';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRippleModule } from '@angular/material/core';

const materialModules = [
  MatTableModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatCheckboxModule,
  MatDialogModule,
  MatButtonModule,
  MatSelectModule,
  MatExpansionModule,
  MatIconModule,
  MatInputModule,
  MatRadioModule,
  MatTooltipModule,
  MatSnackBarModule,
  FormsModule,
  ReactiveFormsModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatProgressSpinnerModule,
  ScrollingModule,
  MatNativeDateModule,
  MatCardModule,
  MatSliderModule,
  MatMenuModule,
  MatBadgeModule,
  MatProgressBarModule,
  DragDropModule,
  ClipboardModule,
  MatTabsModule,
  MatPaginatorModule,
  MatAutocompleteModule,
  MatRippleModule
];

@NgModule({
  declarations: [],
  imports: [CommonModule, ...materialModules],
  exports: [...materialModules]
})
export class AngularMaterialModule {}
