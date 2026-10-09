import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonButtonV4Component } from './common-button-v4.component';

describe('CommonButtonV4Component accessible name', () => {
  let fixture: ComponentFixture<CommonButtonV4Component>;
  const button = () => fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonButtonV4Component, NoopAnimationsModule]
    }).compileComponents();
    fixture = TestBed.createComponent(CommonButtonV4Component);
  });

  it('names an icon-only button from its tooltip', () => {
    fixture.componentRef.setInput('text', '');
    fixture.componentRef.setInput('toolTip', 'Download');
    fixture.detectChanges();
    expect(button().getAttribute('aria-label')).toBe('Download');
  });

  it('prefers an explicit ariaLabel', () => {
    fixture.componentRef.setInput('text', '');
    fixture.componentRef.setInput('toolTip', 'Download');
    fixture.componentRef.setInput('ariaLabel', 'Download statement');
    fixture.detectChanges();
    expect(button().getAttribute('aria-label')).toBe('Download statement');
  });

  it('adds no aria-label when the button has visible text', () => {
    fixture.componentRef.setInput('text', 'Send');
    fixture.componentRef.setInput('toolTip', 'Send a payment');
    fixture.detectChanges();
    expect(button().hasAttribute('aria-label')).toBeFalse();
  });
});
