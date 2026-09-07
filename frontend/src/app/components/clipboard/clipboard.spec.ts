import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClipboardComponent } from './clipboard';

describe('Clipboard', () => {
  let component: ClipboardComponent;
  let fixture: ComponentFixture<ClipboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClipboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ClipboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
