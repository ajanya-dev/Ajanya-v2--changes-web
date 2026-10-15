import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareDownloadOutsideComponent } from './share-download-outside.component';

describe('ShareDownloadOutsideComponent', () => {
  let component: ShareDownloadOutsideComponent;
  let fixture: ComponentFixture<ShareDownloadOutsideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareDownloadOutsideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShareDownloadOutsideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
