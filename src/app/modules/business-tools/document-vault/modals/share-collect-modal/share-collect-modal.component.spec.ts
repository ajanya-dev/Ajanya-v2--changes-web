import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareCollectModalComponent } from './share-collect-modal.component';

describe('ShareCollectModalComponent', () => {
  let component: ShareCollectModalComponent;
  let fixture: ComponentFixture<ShareCollectModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareCollectModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShareCollectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
