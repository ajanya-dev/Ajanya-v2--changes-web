import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareCollectOutsideComponent } from './share-collect-outside.component';

describe('ShareCollectOutsideComponent', () => {
  let component: ShareCollectOutsideComponent;
  let fixture: ComponentFixture<ShareCollectOutsideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareCollectOutsideComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShareCollectOutsideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
