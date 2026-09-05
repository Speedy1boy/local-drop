import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Clipboard } from './clipboard';

describe('Clipboard', () => {
  let component: Clipboard;
  let fixture: ComponentFixture<Clipboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clipboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Clipboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
